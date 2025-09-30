import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '~/services/api';
import { useApi } from './useApi';
import { useSignalR } from './useSignalR';
import { toast } from 'react-toastify';

// Hook quản lý board với optimistic updates + SignalR
export const useBoard = (boardId) => {
  const [board, setBoard] = useState(null);
  const { loading, error, executeRequest } = useApi();
  const { isConnected, signalRService } = useSignalR(boardId);

  // track pending optimistic ids (temp-...)
  const pendingTempIdsRef = useRef(new Set());

  // track active request cancellation
  const activeRequestRef = useRef({ aborted: false });

  // track current user (nếu có) để ignore event do chính client emit
  const currentUserRef = useRef(null);

  // --- Helpers ---
  const makeTempId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return `temp-${crypto.randomUUID()}`;
    return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  };

  const dedupeById = (arr) => {
    const seen = new Set();
    return (arr || []).filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  const ensureUniqueOrder = (arr) => Array.from(new Set(arr || []));

  // find column helper
  const findColumn = (columns, columnId) => (columns || []).find(c => c.id === columnId);

  // Safe add card: sẽ không thêm nếu id đã tồn tại
  // const addCardToColumn = (columns, columnId, card) =>
  //   (columns || []).map(c => {
  //     if (c.id !== columnId) return c;
  //     const exists = (c.cards || []).some(x => x.id === card.id);
  //     if (exists) return c;
  //     return {
  //       ...c,
  //       cards: [...(c.cards || []), card],
  //       cardOrderIds: ensureUniqueOrder([...(c.cardOrderIds || []), card.id])
  //     };
  //   });

  const updateCardInColumns = (columns, columnId, cardId, updatedCard) =>
    (columns || []).map(c => c.id === columnId ? {
      ...c,
      cards: (c.cards || []).map(card => card.id === cardId ? updatedCard : card)
    } : c);

  const removeCardFromColumns = (columns, columnId, cardId) =>
    (columns || []).map(c => c.id === columnId ? {
      ...c,
      cards: (c.cards || []).filter(card => card.id !== cardId),
      cardOrderIds: (c.cardOrderIds || []).filter(id => id !== cardId)
    } : c);

  const replaceColumn = (columns, newColumn) =>
    (columns || []).map(c => (c.id === newColumn.id ? newColumn : c));

  const removeColumnById = (columns, columnId) =>
    (columns || []).filter(c => c.id !== columnId);

  // --- Load initial board ---
  const loadBoard = useCallback(async () => {
    if (!boardId) return;
    activeRequestRef.current.aborted = false;

    const result = await executeRequest(() => apiService.getBoard(boardId));
    if (result.success && !activeRequestRef.current.aborted) {
      setBoard(result.data);
      // try to extract current user if server returns it
      if (result.data?.currentUser) currentUserRef.current = result.data.currentUser;
    }
    else{
      setBoard([])
    }
  }, [boardId, executeRequest]);

  // --- SignalR handlers ---
  useEffect(() => {
    if (!isConnected || !signalRService) return;

    // Try get current user from signalRService if available
    if (typeof signalRService.getCurrentUser === 'function') {
      try { currentUserRef.current = signalRService.getCurrentUser(); } catch { /* ignore */ }
    }

    // Column created
    const onColumnCreated = (data) => {
      const { column, userId, clientTempId } = data;
      if (userId === currentUserRef.current?.id) return;

      setBoard(prev => {
        const cols = prev?.columns || [];
        // if already have real column => skip
        if (cols.some(c => c.id === column.id)) return prev;

        // if clientTempId exists and we have the temp -> replace
        if (clientTempId && cols.some(c => c.id === clientTempId)) {
          const replaced = cols.map(c => c.id === clientTempId ? column : c);
          const newOrder = (prev?.columnOrderIds || []).map(id => id === clientTempId ? column.id : id);
          return { ...prev, columns: replaced, columnOrderIds: ensureUniqueOrder(newOrder) };
        }

        // else push to end, ensure uniqueness
        const newCols = dedupeById([...cols, column]);
        const newOrder = ensureUniqueOrder([...(prev?.columnOrderIds || []), column.id]);
        return { ...prev, columns: newCols, columnOrderIds: newOrder };
      });

      toast.success(`New column "${column.title}" created`);
    };

    const onColumnUpdated = (data) => {
      const { column, userId } = data;
      if (userId === currentUserRef.current?.id) return;
      setBoard(prev => ({ ...prev, columns: replaceColumn(prev?.columns || [], column) }));
    };

    const onColumnDeleted = (data) => {
      const { columnId, userId } = data;
      if (userId === currentUserRef.current?.id) return;
      setBoard(prev => ({
        ...prev,
        columns: removeColumnById(prev?.columns || [], columnId),
        columnOrderIds: (prev?.columnOrderIds || []).filter(id => id !== columnId)
      }));
      toast.info('A column was deleted');
    };

    const onColumnsReordered = (data) => {
      const { columnOrderIds, userId } = data;
      if (userId === currentUserRef.current?.id) return;
      setBoard(prev => {
        const reorderedColumns = columnOrderIds.map(id => prev?.columns?.find(col => col.id === id)).filter(Boolean);
        return { ...prev, columns: reorderedColumns, columnOrderIds };
      });
    };

    // Card events
    const onCardCreated = (data) => {
      const { card, columnId, userId, clientTempId } = data;
      if (userId === currentUserRef.current?.id) return;

      setBoard(prev => {
        const cols = prev?.columns || [];
        const col = findColumn(cols, columnId);
        if (!col) return prev;

        // if already have real card id -> skip
        if ((col.cards || []).some(c => c.id === card.id)) return prev;

        // if clientTempId provided, replace that temp
        if (clientTempId && (col.cards || []).some(c => c.id === clientTempId)) {
          const newCols = cols.map(c => {
            if (c.id !== columnId) return c;
            const newCards = (c.cards || []).map(x => x.id === clientTempId ? card : x);
            const newOrder = (c.cardOrderIds || []).map(id => id === clientTempId ? card.id : id);
            return { ...c, cards: dedupeById(newCards), cardOrderIds: ensureUniqueOrder(newOrder) };
          });
          return { ...prev, columns: newCols };
        }

        // fallback: push card but ensure no duplicates
        const newCols = cols.map(c => c.id === columnId ? {
          ...c,
          cards: dedupeById([...(c.cards || []), card]),
          cardOrderIds: ensureUniqueOrder([...(c.cardOrderIds || []), card.id])
        } : c);

        return { ...prev, columns: newCols };
      });

      toast.success(`New card "${card.title}" created`);
    };

    const onCardUpdated = (data) => {
      const { card, columnId, userId } = data;
      if (userId === currentUserRef.current?.id) return;
      setBoard(prev => ({ ...prev, columns: updateCardInColumns(prev?.columns || [], columnId, card.id, card) }));
    };

    const onCardDeleted = (data) => {
      const { cardId, columnId, userId } = data;
      if (userId === currentUserRef.current?.id) return;
      setBoard(prev => ({ ...prev, columns: removeCardFromColumns(prev?.columns || [], columnId, cardId) }));
      toast.info('A card was deleted');
    };

    const onCardsReordered = (data) => {
      const { columnId, cardOrderIds, userId } = data;
      if (userId === currentUserRef.current?.id) return;
      setBoard(prev => ({
        ...prev,
        columns: (prev?.columns || []).map(col => {
          if (col.id === columnId) {
            const reorderedCards = cardOrderIds.map(id => col.cards?.find(card => card.id === id)).filter(Boolean);
            return { ...col, cards: reorderedCards, cardOrderIds };
          }
          return col;
        })
      }));
    };

    const onCardMoved = (data) => {
      const { cardId, fromColumnId, toColumnId, newIndex, userId } = data;
      if (userId === currentUserRef.current?.id) return;
      setBoard(prev => {
        const fromColumn = findColumn(prev?.columns || [], fromColumnId);
        const toColumn = findColumn(prev?.columns || [], toColumnId);
        const card = fromColumn?.cards?.find(c => c.id === cardId);
        if (!card || !fromColumn || !toColumn) return prev;

        const updatedCard = { ...card, columnId: toColumnId };

        return {
          ...prev,
          columns: (prev?.columns || []).map(col => {
            if (col.id === fromColumnId) {
              return {
                ...col,
                cards: (col.cards || []).filter(c => c.id !== cardId),
                cardOrderIds: (col.cardOrderIds || []).filter(id => id !== cardId)
              };
            }
            if (col.id === toColumnId) {
              const newCards = [...(col.cards || [])];
              newCards.splice(newIndex, 0, updatedCard);
              return { ...col, cards: newCards, cardOrderIds: newCards.map(c => c.id) };
            }
            return col;
          })
        };
      });
      toast.info('A card was moved');
    };

    // register listeners
    signalRService.onColumnCreated?.(onColumnCreated);
    signalRService.onColumnUpdated?.(onColumnUpdated);
    signalRService.onColumnDeleted?.(onColumnDeleted);
    signalRService.onColumnsReordered?.(onColumnsReordered);

    signalRService.onCardCreated?.(onCardCreated);
    signalRService.onCardUpdated?.(onCardUpdated);
    signalRService.onCardDeleted?.(onCardDeleted);
    signalRService.onCardsReordered?.(onCardsReordered);
    signalRService.onCardMoved?.(onCardMoved);

    signalRService.onUserJoined?.((d) => toast.success(`${d.user.userName} joined the board`, { position: 'bottom-left', autoClose: 2000 }));
    signalRService.onUserLeft?.((d) => toast.info(`${d.user.userName} left the board`, { position: 'bottom-left', autoClose: 2000 }));

    return () => {
      // remove listeners safely
      signalRService.removeAllListeners?.();
    };
  }, [isConnected, signalRService]);

  // load board when boardId changes
  useEffect(() => {
    activeRequestRef.current.aborted = false;
    if (boardId) loadBoard();

    return () => { activeRequestRef.current.aborted = true; };
  }, [boardId, loadBoard]);

  // --- Actions with optimistic updates ---
  const createColumn = async (columnData) => {
    const tempId = makeTempId();
    const tempColumn = { ...columnData, id: tempId, cards: [], cardOrderIds: [] };

    pendingTempIdsRef.current.add(tempId);

    setBoard(prev => ({
      ...prev,
      columns: [...(prev?.columns || []), tempColumn],
      columnOrderIds: [...(prev?.columnOrderIds || []), tempId]
    }));

    // send clientTempId so server can echo it (if server supports)
    const payload = { ...columnData, clientTempId: tempId };
    const result = await executeRequest(() => apiService.createColumn(boardId, payload));

    pendingTempIdsRef.current.delete(tempId);

    if (result.success) {
      const real = result.data;
      setBoard(prev => {
        const cols = prev?.columns || [];
        // loại bỏ temp và bất kỳ column có id trùng real.id
        const filtered = cols.filter(c => c.id !== tempId && c.id !== real.id);
        const tempIndex = cols.findIndex(c => c.id === tempId);
        if (tempIndex !== -1) filtered.splice(tempIndex, 0, real); else filtered.push(real);
        const newOrder = (prev?.columnOrderIds || []).map(id => id === tempId ? real.id : id).filter((id, idx, arr) => arr.indexOf(id) === idx);
        return { ...prev, columns: filtered, columnOrderIds: newOrder };
      });
      return result.data;
    }

    // on failure, rollback optimistic
    setBoard(prev => ({ ...prev, columns: (prev?.columns || []).filter(c => c.id !== tempId), columnOrderIds: (prev?.columnOrderIds || []).filter(id => id !== tempId) }));
    return null;
  };

  const createCard = async (columnId, cardData) => {
    const tempId = makeTempId();

    pendingTempIdsRef.current.add(tempId);

    // send clientTempId for server to echo (if supported)
    const payload = { ...cardData, clientTempId: tempId };
    const result = await executeRequest(() => apiService.createCard(boardId, columnId, payload));

    pendingTempIdsRef.current.delete(tempId);

    if (result.success) {
      const real = result.data;

      setBoard(prev => {
        const cols = prev?.columns || [];
        const newCols = cols.map(col => {
          if (col.id !== columnId) return col;

          const cards = col.cards || [];
          const tempIndex = cards.findIndex(c => c.id === tempId);
          const filtered = cards.filter(c => c.id !== tempId && c.id !== real.id);

          if (tempIndex !== -1) filtered.splice(tempIndex, 0, real); else filtered.push(real);

          let newOrder = (col.cardOrderIds || []).map(id => id === tempId ? real.id : id);
          if (!newOrder.includes(real.id)) newOrder.push(real.id);
          newOrder = ensureUniqueOrder(newOrder);

          return { ...col, cards: dedupeById(filtered), cardOrderIds: newOrder };
        });

        return { ...prev, columns: newCols };
      });

      return result.data;
    }

    // rollback optimistic
    setBoard(prev => ({ ...prev, columns: removeCardFromColumns(prev?.columns || [], columnId, tempId) }));
    return null;
  };

  const deleteColumn = async (columnId) => {
    const result = await executeRequest(() => apiService.deleteColumn(boardId, columnId));
    if (result.success) {
      setBoard(prev => ({ ...prev, columns: removeColumnById(prev?.columns || [], columnId), columnOrderIds: (prev?.columnOrderIds || []).filter(id => id !== columnId) }));
      return true;
    }
    return false;
  };

  const moveCard = async (fromColumnId, toColumnId, cardId, positionIndex) => {
    const result = await executeRequest(() => apiService.moveCard(boardId, fromColumnId, cardId, { fromColumnId, toColumnId, newIndex: positionIndex }));
    return result.success;
  };

  const reorderColumns = async (columnOrderIds) => {
    const result = await executeRequest(() => apiService.reorderColumns(boardId, columnOrderIds));
    return result.success;
  };

  const reorderCards = async (columnId, cardOrderIds) => {
    const result = await executeRequest(() => apiService.reorderCards(boardId, columnId, cardOrderIds));
    return result.success;
  };

  const updateCard = async (columnId, cardId) => {
    
  }

  const deleteCard = async (columnId, cardId) => {
    const snapshot = board;

    const removedCard = snapshot?.columns?.find(c => c.id === columnId)?.cards?.find(card => card.id === cardId) || null;

    setBoard(prev => ({
      ...prev,
      columns: (prev?.columns || []).map(c => {
        if (c.id !== columnId) return c;
        return {
          ...c,
          cards: (c.cards || []).filter(card => card.id !== cardId),
          cardOrderIds: (c.cardOrderIds || []).filter(id => id !== cardId)
        };
      })
    }));

    const result = await executeRequest(() => apiService.deleteCard(boardId, columnId,cardId));

    if (result.success) {
      return true;
    }

    if (removedCard) {
      setBoard(prev => ({
        ...prev,
        columns: (prev?.columns || []).map(c => {
          if (c.id !== columnId) return c;
          const exists = (c.cards || []).some(x => x.id === removedCard.id);
          if (exists) return c;
          return {
            ...c,
            cards: dedupeById([...(c.cards || []), removedCard]),
            cardOrderIds: ensureUniqueOrder([...(c.cardOrderIds || []), removedCard.id])
          };
        })
      }));
    } else {
      await loadBoard();
    }

    toast.error('Xóa card thất bại — đã khôi phục trạng thái.');
    return false;
  };

  return {
    board,
    loading,
    error,
    isConnected,
    loadBoard,
    createColumn,
    deleteColumn,
    createCard,
    moveCard,
    reorderColumns,
    reorderCards,
    deleteCard
  };
};

export default useBoard;