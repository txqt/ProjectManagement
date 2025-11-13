using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Activity;
using ProjectManagement.Models.DTOs.Attachment;
using ProjectManagement.Models.DTOs.BoardJoinRequest;
using ProjectManagement.Models.DTOs.Card;
using ProjectManagement.Models.DTOs.Checklist;
using ProjectManagement.Models.DTOs.Column;
using ProjectManagement.Models.DTOs.Comment;
using ProjectManagement.Models.DTOs.Label;
using ProjectManagement.Models.DTOs.Notification;

namespace ProjectManagement.Services.Interfaces
{
    public interface IBoardNotificationService
    {
        Task BroadcastColumnCreated(string boardId, ColumnDto column, string userId);
        Task BroadcastColumnUpdated(string boardId, ColumnDto column, string userId);
        Task BroadcastColumnDeleted(string boardId, string columnId, string userId);
        Task BroadcastColumnsReordered(string boardId, List<string> columnIds, List<ColumnDto> orderedColumns, string userId);
    
        Task BroadcastCardCreated(string boardId, string columnId, CardDto card, string userId);
        Task BroadcastCardUpdated(string boardId, string columnId, CardDto card, string userId);
        Task BroadcastCardDeleted(string boardId, string columnId, string cardId, string userId);
        Task BroadcastCardsReordered(string boardId, string columnId, List<string> cardIds, List<CardDto> orderedCards, string userId);
        Task BroadcastCardMoved(string boardId, string fromColumnId, string toColumnId, string cardId, int newIndex, string userId);
    
        Task BroadcastCardAssigned(string boardId, string columnId, CardDto card, string assignedUserId, string actingUserId);
        Task BroadcastCardUnassigned(string boardId, string columnId, CardDto card, string unassignedUserId, string actingUserId);

        Task SendNotificationToUser(string userId, NotificationDto notification);
        Task BroadcastNotificationRead(string userId, string notificationId);
        Task BroadcastNotificationDeleted(string userId, string notificationId);
        
        // Comment events
        Task BroadcastCommentAdded(string boardId, string columnId, string cardId, CommentDto comment, string userId);
        Task BroadcastCommentUpdated(string boardId, string columnId, string cardId, CommentDto comment, string userId);
        Task BroadcastCommentDeleted(string boardId, string columnId, string cardId, string commentId, string userId);
        
        // Attachment events
        Task BroadcastAttachmentAdded(string boardId, string columnId, string cardId, AttachmentDto attachment, string userId);
        Task BroadcastAttachmentDeleted(string boardId, string columnId, string cardId, string attachmentId, string userId);

        Task BroadcastJoinRequestCreated(string boardId, BoardJoinRequestDto request);
        Task BroadcastJoinRequestResponded(string boardId, string requestId, string status, string userId);
        
        // Activity logs
        Task BroadcastActivityLogged(string boardId, ActivityLogDto activityLogDto);
        
        // Label events
        Task BroadcastLabelCreated(string boardId, LabelDto label, string userId);
        Task BroadcastLabelUpdated(string boardId, LabelDto label, string userId);
        Task BroadcastLabelDeleted(string boardId, string labelId, string userId);
        Task BroadcastCardLabelAdded(string boardId, string columnId, string cardId, string labelId, string userId);
        Task BroadcastCardLabelRemoved(string boardId, string columnId, string cardId, string labelId, string userId);

        // Checklist events
        Task BroadcastChecklistCreated(string boardId, string columnId, string cardId, ChecklistDto checklist, string userId);
        Task BroadcastChecklistUpdated(string boardId, string columnId, string cardId, ChecklistDto checklist, string userId);
        Task BroadcastChecklistDeleted(string boardId, string columnId, string cardId, string checklistId, string userId);
        Task BroadcastChecklistItemCreated(string boardId, string columnId, string cardId, string checklistId, ChecklistItemDto item, string userId);
        Task BroadcastChecklistItemUpdated(string boardId, string columnId, string cardId, string checklistId, ChecklistItemDto item, string userId);
        Task BroadcastChecklistItemToggled(string boardId, string columnId, string cardId, string checklistId, ChecklistItemDto item, string userId);
        Task BroadcastChecklistItemDeleted(string boardId, string columnId, string cardId, string checklistId, string itemId, string userId);
    }
}
