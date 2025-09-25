import { useState, useEffect, useCallback } from 'react';
import { apiService } from '~/services/api';
import { useApi } from './useApi';

export const useBoard = (boardId) => {
  const [board, setBoard] = useState(null);
  const { loading, error, executeRequest } = useApi();

  const loadBoard = useCallback(async () => {
    const result = await executeRequest(() => apiService.getBoard(boardId));
    if (result.success) {
      setBoard(result.data);
    }
  }, [boardId, executeRequest]);

  useEffect(() => {
    if (boardId) {
      loadBoard();
    }
  }, [boardId, loadBoard]);

  const updateBoard = async (updateData) => {
    const result = await executeRequest(() =>
      apiService.updateBoard(boardId, updateData)
    );
    if (result.success) {
      setBoard(result.data);
      return result.data;
    }
    return null;
  };

  const createColumn = async (columnData) => {
    const result = await executeRequest(() =>
      apiService.createColumn(boardId, columnData)
    );

    if (result.success) {
      const newColumn = result.data;

      // cập nhật board ngay tại state
      setBoard(prev => ({
        ...prev,
        columns: [...(prev.columns || []), newColumn]
      }));

      return newColumn;
    }
    return null;
  };


  const updateColumn = async (columnId, updateData) => {
    const result = await executeRequest(() =>
      apiService.updateColumn(boardId, columnId, updateData)
    );
    if (result.success) {
      await loadBoard();
      return result.data;
    }
    return null;
  };

  const deleteColumn = async (columnId) => {
    const result = await executeRequest(() =>
      apiService.deleteColumn(boardId, columnId)
    );
    if (result.success) {
      await loadBoard();
      return true;
    }
    return false;
  };

  const createCard = async (columnId, cardData) => {
    const result = await executeRequest(() =>
      apiService.createCard(columnId, cardData)
    );
    if (result.success) {
      await loadBoard();
      return result.data;
    }
    return null;
  };

  const updateCard = async (columnId, cardId, updateData) => {
    const result = await executeRequest(() =>
      apiService.updateCard(columnId, cardId, updateData)
    );
    if (result.success) {
      await loadBoard();
      return result.data;
    }
    return null;
  };

  const deleteCard = async (columnId, cardId) => {
    const result = await executeRequest(() =>
      apiService.deleteCard(columnId, cardId)
    );
    if (result.success) {
      await loadBoard();
      return true;
    }
    return false;
  };

  const moveCard = async (columnId, cardId, moveData) => {
    const result = await executeRequest(() =>
      apiService.moveCard(columnId, cardId, moveData)
    );
    if (result.success) {
      await loadBoard();
      return true;
    }
    return false;
  };

  const reorderColumns = async (columnOrderIds) => {
    const result = await executeRequest(() =>
      apiService.reorderColumns(boardId, columnOrderIds)
    );
    if (result.success) {
      await loadBoard();
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
  };
};
