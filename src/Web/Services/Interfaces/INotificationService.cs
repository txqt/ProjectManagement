using ProjectManagement.Models.DTOs.Comment;
using ProjectManagement.Models.DTOs.Notification;

namespace ProjectManagement.Services.Interfaces
{
    public interface INotificationService
    {
        Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto createNotificationDto);
        Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(string userId, int skip = 0, int take = 20, bool? unreadOnly = null);
        Task<NotificationSummaryDto> GetNotificationSummaryAsync(string userId);
        Task<bool> MarkAsReadAsync(string notificationId, string userId);
        Task<bool> MarkAllAsReadAsync(string userId);
        Task<bool> DeleteNotificationAsync(string notificationId, string userId);
        Task<int> BulkActionAsync(BulkNotificationActionDto actionDto, string userId);

        // Helper methods for creating specific notification types
        Task CreateBoardInviteNotificationAsync(string inviteeId, string inviterName, string boardTitle, string inviteId);
        Task CreateCardAssignedNotificationAsync(string assigneeId, string assignerName, string cardTitle, string boardTitle, string cardId);
        Task CreateCommentNotificationAsync(string userId, string commenterName, string cardTitle, string boardTitle, string cardId);
        Task CreateBoardMemberAddedNotificationAsync(string userId, string adderName, string boardTitle, string boardId);
    }
}
