import { useEffect } from 'react';
import { useBoardStore } from '~/stores/boardStore';
import { useSignalR } from './useSignalR';
import { toast } from 'react-toastify';

/**
 * Hook wrapper để sử dụng Board Store với SignalR integration
 * @param {string} boardId - ID của board
 * @returns {object} Board state và actions
 */
export const useBoard = (boardId) => {
  const { isConnected, signalRService } = useSignalR(boardId);

  // Lấy state và actions từ Zustand store
  const board = useBoardStore((state) => state.board);
  const loading = useBoardStore((state) => state.loading);
  const error = useBoardStore((state) => state.error);
  const pendingTempIds = useBoardStore((state) => state.pendingTempIds);
  const currentUser = useBoardStore((state) => state.currentUser);

  // Actions
  const loadBoard = useBoardStore((state) => state.loadBoard);
  const createColumn = useBoardStore((state) => state.createColumn);
  const updateColumn = useBoardStore((state) => state.updateColumn);
  const deleteColumn = useBoardStore((state) => state.deleteColumn);
  const createCard = useBoardStore((state) => state.createCard);
  const updateCard = useBoardStore((state) => state.updateCard);
  const deleteCard = useBoardStore((state) => state.deleteCard);
  const moveCard = useBoardStore((state) => state.moveCard);
  const reorderColumns = useBoardStore((state) => state.reorderColumns);
  const reorderCards = useBoardStore((state) => state.reorderCards);
  const assignCardMember = useBoardStore((state) => state.assignCardMember);
  const unassignCardMember = useBoardStore((state) => state.unassignCardMember);

  // SignalR handlers
  const handleColumnCreated = useBoardStore((state) => state.handleColumnCreated);
  const handleColumnUpdated = useBoardStore((state) => state.handleColumnUpdated);
  const handleColumnDeleted = useBoardStore((state) => state.handleColumnDeleted);
  const handleColumnsReordered = useBoardStore((state) => state.handleColumnsReordered);
  const handleCardCreated = useBoardStore((state) => state.handleCardCreated);
  const handleCardUpdated = useBoardStore((state) => state.handleCardUpdated);
  const handleCardDeleted = useBoardStore((state) => state.handleCardDeleted);
  const handleCardsReordered = useBoardStore((state) => state.handleCardsReordered);
  const handleCardMoved = useBoardStore((state) => state.handleCardMoved);
  const handleCardAssigned = useBoardStore((state) => state.handleCardAssigned);
  const handleCardUnassigned = useBoardStore((state) => state.handleCardUnassigned);

  // SignalR handlers
  const handleCommentAdded = useBoardStore((state) => state.handleCommentAdded);
  const handleCommentUpdated = useBoardStore((state) => state.handleCommentUpdated);
  const handleCommentDeleted = useBoardStore((state) => state.handleCommentDeleted);
  const handleAttachmentAdded = useBoardStore((state) => state.handleAttachmentAdded);
  const handleAttachmentDeleted = useBoardStore((state) => state.handleAttachmentDeleted);

  const handleJoinRequestCreated = useBoardStore((state) => state.handleJoinRequestCreated);
  const handleJoinRequestResponded = useBoardStore((state) => state.handleJoinRequestResponded);

  const handleActivityLogged = useBoardStore((state) => state.handleActivityLogged);

  const boardLabels = useBoardStore((state) => state.boardLabels);
  const loadBoardLabels = useBoardStore((state) => state.loadBoardLabels);
  const createLabel = useBoardStore((state) => state.createLabel);
  const updateLabel = useBoardStore((state) => state.updateLabel);
  const deleteLabel = useBoardStore((state) => state.deleteLabel);
  const addLabelToCard = useBoardStore((state) => state.addLabelToCard);
  const removeLabelFromCard = useBoardStore((state) => state.removeLabelFromCard);

  const createChecklist = useBoardStore((state) => state.createChecklist);
  const updateChecklist = useBoardStore((state) => state.updateChecklist);
  const deleteChecklist = useBoardStore((state) => state.deleteChecklist);
  const createChecklistItem = useBoardStore((state) => state.createChecklistItem);
  const updateChecklistItem = useBoardStore((state) => state.updateChecklistItem);
  const toggleChecklistItem = useBoardStore((state) => state.toggleChecklistItem);
  const deleteChecklistItem = useBoardStore((state) => state.deleteChecklistItem);

  // SignalR handlers
  const handleLabelCreated = useBoardStore((state) => state.handleLabelCreated);
  const handleLabelUpdated = useBoardStore((state) => state.handleLabelUpdated);
  const handleLabelDeleted = useBoardStore((state) => state.handleLabelDeleted);
  const handleCardLabelAdded = useBoardStore((state) => state.handleCardLabelAdded);
  const handleCardLabelRemoved = useBoardStore((state) => state.handleCardLabelRemoved);

  const handleChecklistCreated = useBoardStore((state) => state.handleChecklistCreated);
  const handleChecklistUpdated = useBoardStore((state) => state.handleChecklistUpdated);
  const handleChecklistDeleted = useBoardStore((state) => state.handleChecklistDeleted);
  const handleChecklistItemCreated = useBoardStore((state) => state.handleChecklistItemCreated);
  const handleChecklistItemUpdated = useBoardStore((state) => state.handleChecklistItemUpdated);
  const handleChecklistItemToggled = useBoardStore((state) => state.handleChecklistItemToggled);
  const handleChecklistItemDeleted = useBoardStore((state) => state.handleChecklistItemDeleted);

  // Set boardId khi thay đổi
  useEffect(() => {
    if (boardId) {
      useBoardStore.getState().setBoardId(boardId);
    }
  }, [boardId]);

  // Load board khi boardId thay đổi
  useEffect(() => {
    if (boardId) {
      loadBoard(boardId);
    }
  }, [boardId, loadBoard]);

  useEffect(() => {
    if (boardId) {
      loadBoardLabels(boardId);
    }
  }, [boardId, loadBoardLabels]);

  // Sync current user từ SignalR
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser) {
          useBoardStore.getState().setCurrentUser(parsedUser);
          signalRService.setCurrentUser(parsedUser);
          return;
        }
      } catch (err) {
        console.warn('Failed to parse userData from localStorage:', err);
      }
    }

    if (isConnected && signalRService) {
      if (typeof signalRService.getCurrentUser === 'function') {
        try {
          const user = signalRService.getCurrentUser();
          if (user) {
            useBoardStore.getState().setCurrentUser(user);
          }
        } catch (error) {
          console.warn('Failed to get current user from SignalR:', error);
        }
      }
    }
  }, [isConnected, signalRService]);

  // Kết nối SignalR event handlers
  useEffect(() => {
    if (!isConnected || !signalRService) return;

    // Column events
    signalRService.onColumnCreated?.(handleColumnCreated);
    signalRService.onColumnUpdated?.(handleColumnUpdated);
    signalRService.onColumnDeleted?.(handleColumnDeleted);
    signalRService.onColumnsReordered?.(handleColumnsReordered);

    // Card events
    signalRService.onCardCreated?.(handleCardCreated);
    signalRService.onCardUpdated?.(handleCardUpdated);
    signalRService.onCardDeleted?.(handleCardDeleted);
    signalRService.onCardsReordered?.(handleCardsReordered);
    signalRService.onCardMoved?.(handleCardMoved);
    signalRService.onCardAssigned?.(handleCardAssigned);
    signalRService.onCardUnassigned?.(handleCardUnassigned);

    // User presence events
    signalRService.onUserLeft?.((data) => {
      toast.info(`${data.user.userName} left the board`, {
        position: 'bottom-left',
        autoClose: 2000
      });
    });

    // Comment events
    signalRService.onCommentAdded?.(handleCommentAdded);
    signalRService.onCommentUpdated?.(handleCommentUpdated);
    signalRService.onCommentDeleted?.(handleCommentDeleted);

    // ✅ FIX: Attachment events - THÊM VÀO ĐÂY
    signalRService.onAttachmentAdded?.(handleAttachmentAdded);
    signalRService.onAttachmentDeleted?.(handleAttachmentDeleted);

    signalRService.onJoinRequestCreated?.(handleJoinRequestCreated);
    signalRService.onJoinRequestResponded?.(handleJoinRequestResponded);

    signalRService.onActivityLogged(handleActivityLogged);

    // Label events
    signalRService.onLabelCreated?.(handleLabelCreated);
    signalRService.onLabelUpdated?.(handleLabelUpdated);
    signalRService.onLabelDeleted?.(handleLabelDeleted);
    signalRService.onCardLabelAdded?.(handleCardLabelAdded);
    signalRService.onCardLabelRemoved?.(handleCardLabelRemoved);

    // Checklist events
    signalRService.onChecklistCreated?.(handleChecklistCreated);
    signalRService.onChecklistUpdated?.(handleChecklistUpdated);
    signalRService.onChecklistDeleted?.(handleChecklistDeleted);
    signalRService.onChecklistItemCreated?.(handleChecklistItemCreated);
    signalRService.onChecklistItemUpdated?.(handleChecklistItemUpdated);
    signalRService.onChecklistItemToggled?.(handleChecklistItemToggled);
    signalRService.onChecklistItemDeleted?.(handleChecklistItemDeleted);

    // Cleanup function
    return () => {
      // Best-effort cleanup
      if (typeof signalRService.removeAllListeners === 'function') {
        signalRService.removeAllListeners();
        return;
      }

      // Try specific off methods
      signalRService.offColumnCreated?.(handleColumnCreated);
      signalRService.offColumnUpdated?.(handleColumnUpdated);
      signalRService.offColumnDeleted?.(handleColumnDeleted);
      signalRService.offColumnsReordered?.(handleColumnsReordered);

      signalRService.offCardCreated?.(handleCardCreated);
      signalRService.offCardUpdated?.(handleCardUpdated);
      signalRService.offCardDeleted?.(handleCardDeleted);
      signalRService.offCardsReordered?.(handleCardsReordered);
      signalRService.offCardMoved?.(handleCardMoved);
      signalRService.offCardAssigned?.(handleCardAssigned);
      signalRService.offCardUnassigned?.(handleCardUnassigned);

      signalRService.offCommentAdded?.(handleCommentAdded);
      signalRService.offCommentUpdated?.(handleCommentUpdated);
      signalRService.offCommentDeleted?.(handleCommentDeleted);

      signalRService.offAttachmentAdded?.(handleAttachmentAdded);
      signalRService.offAttachmentDeleted?.(handleAttachmentDeleted);

      signalRService.offJoinRequestCreated?.(handleJoinRequestCreated);
      signalRService.offJoinRequestResponded?.(handleJoinRequestResponded);

      signalRService.offActivityLogged?.(handleActivityLogged);
      signalRService.offLabelCreated?.(handleLabelCreated);
      signalRService.offLabelUpdated?.(handleLabelUpdated);
      signalRService.offLabelDeleted?.(handleLabelDeleted);
      signalRService.offCardLabelAdded?.(handleCardLabelAdded);
      signalRService.offCardLabelRemoved?.(handleCardLabelRemoved);

      signalRService.offChecklistCreated?.(handleChecklistCreated);
      signalRService.offChecklistUpdated?.(handleChecklistUpdated);
      signalRService.offChecklistDeleted?.(handleChecklistDeleted);
      signalRService.offChecklistItemCreated?.(handleChecklistItemCreated);
      signalRService.offChecklistItemUpdated?.(handleChecklistItemUpdated);
      signalRService.offChecklistItemToggled?.(handleChecklistItemToggled);
      signalRService.offChecklistItemDeleted?.(handleChecklistItemDeleted);

      // Try generic off method
      if (typeof signalRService.off === 'function') {
        try {
          signalRService.off('columnCreated', handleColumnCreated);
          signalRService.off('columnUpdated', handleColumnUpdated);
          signalRService.off('columnDeleted', handleColumnDeleted);
          signalRService.off('columnsReordered', handleColumnsReordered);

          signalRService.off('cardCreated', handleCardCreated);
          signalRService.off('cardUpdated', handleCardUpdated);
          signalRService.off('cardDeleted', handleCardDeleted);
          signalRService.off('cardsReordered', handleCardsReordered);
          signalRService.off('cardMoved', handleCardMoved);
          signalRService.off('cardAssigned', handleCardAssigned);
          signalRService.off('cardUnassigned', handleCardUnassigned);
          signalRService.off('commentAdded', handleCommentAdded);
          signalRService.off('commentUpdated', handleCommentUpdated);
          signalRService.off('commentDeleted', handleCommentDeleted);
          signalRService.off('attachmentAdded', handleAttachmentAdded);
          signalRService.off('attachmentDeleted', handleAttachmentDeleted);
          signalRService.off('joinRequestCreated', handleJoinRequestCreated);
          signalRService.off('joinRequestResponded', handleJoinRequestResponded);
          signalRService.off('activityLogged', handleActivityLogged);
          signalRService.off('labelCreated', handleLabelCreated);
          signalRService.off('labelUpdated', handleLabelUpdated);
          signalRService.off('labelDeleted', handleLabelDeleted);
          signalRService.off('cardLabelAdded', handleCardLabelAdded);
          signalRService.off('cardLabelRemoved', handleCardLabelRemoved);

          signalRService.off('checklistCreated', handleChecklistCreated);
          signalRService.off('checklistUpdated', handleChecklistUpdated);
          signalRService.off('checklistDeleted', handleChecklistDeleted);
          signalRService.off('checklistItemCreated', handleChecklistItemCreated);
          signalRService.off('checklistItemUpdated', handleChecklistItemUpdated);
          signalRService.off('checklistItemToggled', handleChecklistItemToggled);
          signalRService.off('checklistItemDeleted', handleChecklistItemDeleted);
        } catch (error) {
          console.warn('Error removing SignalR listeners:', error);
        }
      }
    };
  }, [
    isConnected,
    signalRService,
    handleColumnCreated,
    handleColumnUpdated,
    handleColumnDeleted,
    handleColumnsReordered,
    handleCardCreated,
    handleCardUpdated,
    handleCardDeleted,
    handleCardsReordered,
    handleCardMoved,
    handleCardAssigned,
    handleCardUnassigned,
    handleCommentAdded,
    handleCommentUpdated,
    handleCommentDeleted,
    handleAttachmentAdded,
    handleAttachmentDeleted,
    handleJoinRequestCreated,
    handleJoinRequestResponded,
    handleActivityLogged,
    handleLabelCreated,
    handleLabelUpdated,
    handleLabelDeleted,
    handleCardLabelAdded,
    handleCardLabelRemoved,
    handleChecklistCreated,
    handleChecklistUpdated,
    handleChecklistDeleted,
    handleChecklistItemCreated,
    handleChecklistItemUpdated,
    handleChecklistItemToggled,
    handleChecklistItemDeleted
  ]);


  return {
    // State
    board,
    loading,
    error,
    isConnected,
    pendingTempIds,
    currentUser,
    boardLabels,

    // Actions
    loadBoard: () => loadBoard(boardId),
    createColumn,
    updateColumn,
    deleteColumn,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    reorderColumns,
    reorderCards,
    assignCardMember,
    unassignCardMember,
    loadBoardLabels: () => loadBoardLabels(boardId),
    createLabel,
    updateLabel,
    deleteLabel,
    addLabelToCard,
    removeLabelFromCard,

    createChecklist,
    updateChecklist,
    deleteChecklist,
    createChecklistItem,
    updateChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
  };
};

export default useBoard;