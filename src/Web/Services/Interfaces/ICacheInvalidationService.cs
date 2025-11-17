namespace ProjectManagement.Services.Interfaces
{
    public interface ICacheInvalidationService
    {
        Task InvalidateBoardCachesAsync(string boardId);
        Task InvalidateUserBoardsCacheAsync(string userId);
        Task InvalidateCardCachesAsync(string cardId, string boardId);
        Task InvalidateColumnCachesAsync(string columnId, string boardId);
        Task InvalidateAttachmentCachesAsync(string cardId, string boardId);
        Task InvalidateCommentCachesAsync(string cardId, string boardId);
        Task InvalidateChecklistCachesAsync(string cardId, string boardId);
        Task InvalidateLabelCachesAsync(string boardId);
        Task InvalidateNotificationCachesAsync(string userId);
        Task InvalidateBoardInvitesCacheAsync(string boardId);
        Task InvalidateJoinRequestsCacheAsync(string boardId);
        Task InvalidateActivitySummaryCacheAsync(string boardId, int? specificDays = null);
        Task InvalidateMultipleUsersCacheAsync(IEnumerable<string> userIds);
    }
}