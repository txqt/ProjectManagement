using ProjectManagement.Models.DTOs.Activity;

namespace ProjectManagement.Services.Interfaces
{
    public interface IActivityLogService
    {
        Task<ActivityLogDto> LogActivityAsync(string userId, CreateActivityLogDto dto);
        Task<List<ActivityLogDto>> GetBoardActivitiesAsync(string boardId, ActivityFilterDto filter);
        Task<List<ActivityLogDto>> GetCardActivitiesAsync(string boardId, string cardId, int skip = 0, int take = 50);
        Task<ActivitySummaryDto> GetActivitySummaryAsync(string boardId, int days = 7);
        Task DeleteOldActivitiesAsync(int daysToKeep = 90);
    }
}