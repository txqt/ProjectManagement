import { useEffect } from 'react';
import { useBoardStore } from '~/stores/boardStore';
import { useSignalR } from './useSignalR';
import { toast } from 'react-toastify';

/**
 * Hook chỉ để setup SignalR connection và sync events với store
 * Không expose bất kỳ actions nào - consumers nên dùng store trực tiếp
 * @param {string} boardId - ID của board
 * @returns {object} SignalR connection state
 */
export const useBoardSignalR = (boardId) => {
  const { isConnected, signalRService, users, connectionError } = useSignalR(boardId);

  // SignalR handlers từ store
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

  const handleCommentAdded = useBoardStore((state) => state.handleCommentAdded);
  const handleCommentUpdated = useBoardStore((state) => state.handleCommentUpdated);
  const handleCommentDeleted = useBoardStore((state) => state.handleCommentDeleted);
  
  const handleAttachmentAdded = useBoardStore((state) => state.handleAttachmentAdded);
  const handleAttachmentDeleted = useBoardStore((state) => state.handleAttachmentDeleted);

  const handleJoinRequestCreated = useBoardStore((state) => state.handleJoinRequestCreated);
  const handleJoinRequestResponded = useBoardStore((state) => state.handleJoinRequestResponded);

  const handleActivityLogged = useBoardStore((state) => state.handleActivityLogged);

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
      useBoardStore.getState().loadBoard(boardId);
    }
  }, [boardId]);

  // Load board labels
  useEffect(() => {
    if (boardId) {
      useBoardStore.getState().loadBoardLabels(boardId);
    }
  }, [boardId]);

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

    // Attachment events
    signalRService.onAttachmentAdded?.(handleAttachmentAdded);
    signalRService.onAttachmentDeleted?.(handleAttachmentDeleted);

    // Join request events
    signalRService.onJoinRequestCreated?.(handleJoinRequestCreated);
    signalRService.onJoinRequestResponded?.(handleJoinRequestResponded);

    // Activity events
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
      if (typeof signalRService.removeAllListeners === 'function') {
        signalRService.removeAllListeners();
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

  // Chỉ return SignalR connection state
  return {
    isConnected,
    connectionError,
    users, // Active users in board
    signalRService // Expose service nếu cần custom operations
  };
};

export default useBoardSignalR;