import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '~/services/api';
import { useApi } from './useApi';

export const useBoard = (boardId) => {
  const [board, setBoard] = useState(null);
  const { loading, error, executeRequest } = useApi();

  // ref để tránh set state sau khi unmounted / boardId đổi
  const activeRequestRef = useRef({ aborted: false });

  const loadBoard = useCallback(async () => {
    if (!boardId) return;
    activeRequestRef.current.aborted = false;

    const result = await executeRequest(() => apiService.getBoard(boardId));
    if (result.success && !activeRequestRef.current.aborted) {
      setBoard(result.data);
    }
  }, [boardId, executeRequest]);

  useEffect(() => {
    // mỗi lần boardId thay đổi -> cancel previous
    activeRequestRef.current.aborted = false;
    if (boardId) loadBoard();

    return () => {
      // mark aborted để tránh setState khi request cũ về sau
      activeRequestRef.current.aborted = true;
    };
  }, [boardId, loadBoard]);

  // Helper cập nhật cục bộ column/card (immutable)
  const replaceColumn = (columns, newColumn) =>
    (columns || []).map(c => (c.id === newColumn.id ? newColumn : c));

  const removeColumnById = (columns, columnId) =>
    (columns || []).filter(c => c.id !== columnId);

  const addCardToColumn = (columns, columnId, card) =>
    (columns || []).map(c => c.id === columnId ? { ...c, cards: [...(c.cards || []), card] } : c);

  const updateCardInColumns = (columns, columnId, cardId, updatedCard) =>
    (columns || []).map(c => c.id === columnId ? { ...c, cards: (c.cards || []).map(card => card.id === cardId ? updatedCard : card) } : c);

  const removeCardFromColumns = (columns, columnId, cardId) =>
    (columns || []).map(c => c.id === columnId ? { ...c, cards: (c.cards || []).filter(card => card.id !== cardId) } : c);

  // Actions
  const updateBoard = async (updateData) => {
    const result = await executeRequest(() => apiService.updateBoard(boardId, updateData));
    if (result.success) {
      setBoard(result.data);
      return result.data;
    }
    return null;
  };

  const createColumn = async (columnData) => {
    const result = await executeRequest(() => apiService.createColumn(boardId, columnData));
    if (result.success) {
      const newColumn = result.data;
      setBoard(prev => ({
        ...prev,
        columns: [...(prev?.columns || []), newColumn]
      }));
      return newColumn;
    }
    return null;
  };

  const updateColumn = async (columnId, updateData) => {
    const result = await executeRequest(() => apiService.updateColumn(boardId, columnId, updateData));
    if (result.success) {
      setBoard(prev => ({
        ...prev,
        columns: replaceColumn(prev?.columns || [], result.data)
      }));
      return result.data;
    }
    return null;
  };

  const deleteColumn = async (columnId) => {
    const result = await executeRequest(() => apiService.deleteColumn(boardId, columnId));
    if (result.success) {
      setBoard(prev => ({
        ...prev,
        columns: removeColumnById(prev?.columns || [], columnId)
      }));
      return true;
    }
    return false;
  };

  const createCard = async (columnId, cardData) => {
    const result = await executeRequest(() => apiService.createCard(columnId, cardData));
    if (result.success) {
      setBoard(prev => ({
        ...prev,
        columns: addCardToColumn(prev?.columns || [], columnId, result.data)
      }));
      return result.data;
    }
    return null;
  };

  const updateCard = async (columnId, cardId, updateData) => {
    const result = await executeRequest(() => apiService.updateCard(columnId, cardId, updateData));
    if (result.success) {
      setBoard(prev => ({
        ...prev,
        columns: updateCardInColumns(prev?.columns || [], columnId, cardId, result.data)
      }));
      return result.data;
    }
    return null;
  };

  const deleteCard = async (columnId, cardId) => {
    const result = await executeRequest(() => apiService.deleteCard(columnId, cardId));
    if (result.success) {
      setBoard(prev => ({
        ...prev,
        columns: removeCardFromColumns(prev?.columns || [], columnId, cardId)
      }));
      return true;
    }
    return false;
  };

  const moveCard = async (fromColumnId, toColumnId, cardId, positionIndex) => {
    const result = await executeRequest(() =>
      apiService.moveCard(fromColumnId, cardId, { destinationColumnId: toColumnId, position: positionIndex })
    );

    if (!result.success) return false;

    return true;
  };

  const reorderColumns = async (columnOrderIds) => {
    const result = await executeRequest(() => apiService.reorderColumns(boardId, columnOrderIds));
    if (result.success) {
      return true;
    }
    return false;
  };


  const reorderCards = async (columnId, cardOrderIds) => {
    const result = await executeRequest(() => apiService.reorderCards(columnId, cardOrderIds));
    if (result.success) {
      return true;
    }
    return false;
  };

  return {
    board,
    loading,
    error,
    loadBoard,
    updateBoard,
    createColumn,
    updateColumn,
    deleteColumn,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    reorderColumns,
    reorderCards
  };
};