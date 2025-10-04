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

  const pendingTempIdsRef = useRef(new Set());
  const activeRequestRef = useRef({ aborted: false });
  const currentUserRef = useRef(null);

  // --- Helpers ---
  const makeTempId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return `temp-${crypto.randomUUID()}`;
    return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  };

  const dedupeById = (arr = []) => {
    const seen = new Set();
    return arr.filter(item => {
      if (!item) return false;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  const ensureUniqueOrder = (arr = []) => Array.from(new Set(arr));

  const findColumn = (columns = [], columnId) => columns.find(c => c.id === columnId);

  // update a card in a specific column (replace full card object)
  const updateCardInColumns = (columns = [], columnId, cardId, updatedCard) =>
    columns.map(c => c.id === columnId ? { ...c, cards: (c.cards || []).map(card => card.id === cardId ? updatedCard : card) } : c);

  const addCardToColumn = (columns = [], columnId, card, atIndex = null) =>
    columns.map(c => {
      if (c.id !== columnId) return c;
      const cards = [...(c.cards || [])];
      if (atIndex == null) cards.push(card);
      else cards.splice(Math.max(0, Math.min(atIndex, cards.length)), 0, card);
      return { ...c, cards: dedupeById(cards), cardOrderIds: ensureUniqueOrder((c.cardOrderIds || []).concat(card.id)) };
    });

  const removeCardFromColumns = (columns = [], columnId, cardId) =>
    columns.map(c => c.id === columnId ? { ...c, cards: (c.cards || []).filter(card => card.id !== cardId), cardOrderIds: (c.cardOrderIds || []).filter(id => id !== cardId) } : c);

  const replaceColumn = (columns = [], newColumn) => columns.map(c => (c.id === newColumn.id ? newColumn : c));
  const removeColumnById = (columns = [], columnId) => columns.filter(c => c.id !== columnId);

  const moveCardInState = (columns = [], fromColumnId, toColumnId, cardId, newIndex) => {
    const from = findColumn(columns, fromColumnId);
    const to = findColumn(columns, toColumnId);
    if (!from || !to) return columns;

    const card = (from.cards || []).find(c => c.id === cardId);
    if (!card) return columns;

    const newCols = columns.map(c => {
      if (c.id === fromColumnId) {
        return { ...c, cards: (c.cards || []).filter(x => x.id !== cardId), cardOrderIds: (c.cardOrderIds || []).filter(id => id !== cardId) };
      }
      if (c.id === toColumnId) {
        const newCards = [...(c.cards || [])];
        const insertAt = Math.max(0, Math.min(newIndex, newCards.length));
        newCards.splice(insertAt, 0, { ...card, columnId: toColumnId });
        return { ...c, cards: dedupeById(newCards), cardOrderIds: newCards.map(x => x.id) };
      }
      return c;
    });

    return newCols;
  };

  // --- Load initial board ---
  const loadBoard = useCallback(async () => {
    if (!boardId) return;
    activeRequestRef.current.aborted = false;

    const result = await executeRequest(() => apiService.getBoard(boardId));
    if (result.success && !activeRequestRef.current.aborted) {
      setBoard(result.data || { columns: [], columnOrderIds: [] });
      if (result.data?.currentUser) currentUserRef.current = result.data.currentUser;
    } else {
      // safer fallback object shape
      setBoard({ columns: [], columnOrderIds: [] });
    }
  }, [boardId, executeRequest]);

  // --- SignalR handlers ---
  useEffect(() => {
    if (!isConnected || !signalRService) return;

    if (typeof signalRService.getCurrentUser === 'function') {
      try { currentUserRef.current = signalRService.getCurrentUser(); } catch { /* ignore */ }
    }

    const onColumnCreated = (data) => {
      const { column, userId, clientTempId } = data;
      if (userId === currentUserRef.current?.id) return;

      setBoard(prev => {
        const cols = prev?.columns || [];
        if (cols.some(c => c.id === column.id)) return prev;

        if (clientTempId && cols.some(c => c.id === clientTempId)) {
          const replaced = cols.map(c => c.id === clientTempId ? column : c);
          const newOrder = (prev?.columnOrderIds || []).map(id => id === clientTempId ? column.id : id);
          return { ...prev, columns: replaced, columnOrderIds: ensureUniqueOrder(newOrder) };
        }

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
      setBoard(prev => ({ ...prev, columns: removeColumnById(prev?.columns || [], columnId), columnOrderIds: (prev?.columnOrderIds || []).filter(id => id !== columnId) }));
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

    const onCardCreated = (data) => {
      const { card, columnId, userId, clientTempId } = data;
      if (userId === currentUserRef.current?.id) return;

      setBoard(prev => {
        const cols = prev?.columns || [];
        const col = findColumn(cols, columnId);
        if (!col) return prev;

        if ((col.cards || []).some(c => c.id === card.id)) return prev;

        if (clientTempId && (col.cards || []).some(c => c.id === clientTempId)) {
          return {
            ...prev,
            columns: cols.map(c => {
              if (c.id !== columnId) return c;
              const newCards = (c.cards || []).map(x => x.id === clientTempId ? card : x);
              const newOrder = (c.cardOrderIds || []).map(id => id === clientTempId ? card.id : id);
              return { ...c, cards: dedupeById(newCards), cardOrderIds: ensureUniqueOrder(newOrder) };
            })
          };
        }

        return { ...prev, columns: cols.map(c => c.id === columnId ? { ...c, cards: dedupeById([...(c.cards || []), card]), cardOrderIds: ensureUniqueOrder([...(c.cardOrderIds || []), card.id]) } : c) };
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
      setBoard(prev => ({ ...prev, columns: moveCardInState(prev?.columns || [], fromColumnId, toColumnId, cardId, newIndex) }));
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
      // best-effort cleanup: prefer removeAllListeners, else try per-listener offs
      if (typeof signalRService.removeAllListeners === 'function') {
        signalRService.removeAllListeners();
        return;
      }

      // try common patterns (some SignalR wrappers expose .off or specific offX functions)
      signalRService.offColumnCreated?.(onColumnCreated);
      signalRService.offColumnUpdated?.(onColumnUpdated);
      signalRService.offColumnDeleted?.(onColumnDeleted);
      signalRService.offColumnsReordered?.(onColumnsReordered);

      signalRService.offCardCreated?.(onCardCreated);
      signalRService.offCardUpdated?.(onCardUpdated);
      signalRService.offCardDeleted?.(onCardDeleted);
      signalRService.offCardsReordered?.(onCardsReordered);
      signalRService.offCardMoved?.(onCardMoved);

      if (typeof signalRService.off === 'function') {
        try {
          signalRService.off('columnCreated', onColumnCreated);
          signalRService.off('columnUpdated', onColumnUpdated);
          signalRService.off('columnDeleted', onColumnDeleted);
          signalRService.off('columnsReordered', onColumnsReordered);

          signalRService.off('cardCreated', onCardCreated);
          signalRService.off('cardUpdated', onCardUpdated);
          signalRService.off('cardDeleted', onCardDeleted);
          signalRService.off('cardsReordered', onCardsReordered);
          signalRService.off('cardMoved', onCardMoved);
        } catch (e) { /* ignore */ }
      }
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

    const payload = { ...columnData, clientTempId: tempId };
    const result = await executeRequest(() => apiService.createColumn(boardId, payload));

    pendingTempIdsRef.current.delete(tempId);

    if (result.success) {
      const real = result.data;
      setBoard(prev => {
        const cols = prev?.columns || [];
        const filtered = cols.filter(c => c.id !== tempId && c.id !== real.id);
        const tempIndex = cols.findIndex(c => c.id === tempId);
        if (tempIndex !== -1) filtered.splice(tempIndex, 0, real); else filtered.push(real);
        const newOrder = (prev?.columnOrderIds || []).map(id => id === tempId ? real.id : id).filter((id, idx, arr) => arr.indexOf(id) === idx);
        return { ...prev, columns: filtered, columnOrderIds: newOrder };
      });
      return result.data;
    }

    // rollback
    setBoard(prev => ({ ...prev, columns: (prev?.columns || []).filter(c => c.id !== tempId), columnOrderIds: (prev?.columnOrderIds || []).filter(id => id !== tempId) }));
    toast.error('Tạo column thất bại');
    return null;
  };

  const updateColumn = async (columnId, updateData) => {
    const snapshot = board;
    // Lấy column gốc
    const originalColumn = snapshot?.columns?.find(c => c.id === columnId) || {};
    // Tạo bản optimistic update
    const optimisticColumn = { ...originalColumn, ...updateData };

    // Optimistic update
    setBoard(prev => ({
      ...prev,
      columns: replaceColumn(prev?.columns || [], optimisticColumn)
    }));

    // Gọi API
    const result = await executeRequest(() => apiService.updateColumn(boardId, columnId, updateData));
    if (result.success) return true;

    // Rollback nếu thất bại
    setBoard(snapshot);
    toast.error('Cập nhật column thất bại — đã khôi phục trạng thái.');
    return false;
  };


  const createCard = async (columnId, cardData) => {
    const tempId = makeTempId();
    const tempCard = { ...cardData, id: tempId };

    pendingTempIdsRef.current.add(tempId);

    // optimistic insert
    setBoard(prev => ({
      ...prev,
      columns: addCardToColumn(prev?.columns || [], columnId, tempCard)
    }));

    const payload = { ...cardData, clientTempId: tempId };
    const result = await executeRequest(() => apiService.createCard(boardId, columnId, payload));

    pendingTempIdsRef.current.delete(tempId);

    if (result.success) {
      const real = result.data;
      setBoard(prev => {
        const cols = prev?.columns || [];
        return {
          ...prev,
          columns: cols.map(col => {
            if (col.id !== columnId) return col;
            const cards = col.cards || [];
            const tempIndex = cards.findIndex(c => c.id === tempId);
            const filtered = cards.filter(c => c.id !== tempId && c.id !== real.id);
            if (tempIndex !== -1) filtered.splice(tempIndex, 0, real); else filtered.push(real);
            let newOrder = (col.cardOrderIds || []).map(id => id === tempId ? real.id : id);
            if (!newOrder.includes(real.id)) newOrder.push(real.id);
            newOrder = ensureUniqueOrder(newOrder);
            return { ...col, cards: dedupeById(filtered), cardOrderIds: newOrder };
          })
        };
      });
      return result.data;
    }

    // rollback optimistic card
    setBoard(prev => ({ ...prev, columns: removeCardFromColumns(prev?.columns || [], columnId, tempId) }));
    toast.error('Tạo card thất bại');
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
    const snapshot = board;
    // optimistic move
    setBoard(prev => ({ ...prev, columns: moveCardInState(prev?.columns || [], fromColumnId, toColumnId, cardId, positionIndex) }));

    const result = await executeRequest(() => apiService.moveCard(boardId, fromColumnId, cardId, { fromColumnId, toColumnId, newIndex: positionIndex }));
    if (result.success) return true;

    // rollback
    setBoard(snapshot);
    toast.error('Di chuyển card thất bại — đã khôi phục trạng thái.');
    return false;
  };

  const reorderColumns = async (columnOrderIds) => {
    const result = await executeRequest(() => apiService.reorderColumns(boardId, columnOrderIds));
    return result.success;
  };

  const reorderCards = async (columnId, cardOrderIds) => {
    const result = await executeRequest(() => apiService.reorderCards(boardId, columnId, cardOrderIds));
    return result.success;
  };

  const updateCard = async (columnId, cardId, updateData) => {
    const snapshot = board;
    // optimistic update: merge existing card + updateData
    const originalCard = snapshot?.columns?.find(c => c.id === columnId)?.cards?.find(x => x.id === cardId) || {};
    const optimisticCard = { ...originalCard, ...updateData };

    setBoard(prev => ({ ...prev, columns: updateCardInColumns(prev?.columns || [], columnId, cardId, optimisticCard) }));

    const result = await executeRequest(() => apiService.updateCard(boardId, columnId, cardId, updateData));
    if (result.success) return true;

    // rollback
    setBoard(snapshot);
    toast.error('Cập nhật card thất bại — đã khôi phục trạng thái.');
    return false;
  };

  const deleteCard = async (columnId, cardId) => {
    const snapshot = board;
    const removedCard = snapshot?.columns?.find(c => c.id === columnId)?.cards?.find(card => card.id === cardId) || null;

    // optimistic remove
    setBoard(prev => ({ ...prev, columns: (prev?.columns || []).map(c => c.id === columnId ? { ...c, cards: (c.cards || []).filter(card => card.id !== cardId), cardOrderIds: (c.cardOrderIds || []).filter(id => id !== cardId) } : c) }));

    const result = await executeRequest(() => apiService.deleteCard(boardId, columnId, cardId));
    if (result.success) return true;

    // rollback
    if (removedCard) {
      setBoard(prev => ({
        ...prev,
        columns: (prev?.columns || []).map(c => {
          if (c.id !== columnId) return c;
          const exists = (c.cards || []).some(x => x.id === removedCard.id);
          if (exists) return c;
          return { ...c, cards: dedupeById([...(c.cards || []), removedCard]), cardOrderIds: ensureUniqueOrder([...(c.cardOrderIds || []), removedCard.id]) };
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
    updateColumn,
    deleteColumn,
    createCard,
    moveCard,
    reorderColumns,
    reorderCards,
    deleteCard,
    updateCard,
    pendingTempIds: pendingTempIdsRef.current,
  };
};

export default useBoard;