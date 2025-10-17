using ProjectManagement.Models.Domain.Entities;

namespace ProjectManagement.Services.Interfaces
{
    public interface IPermissionService
    {
        Task<bool> HasSystemPermissionAsync(string userId, string permission);
        Task<(bool HasPermission, string Reason)> CheckBoardPermissionAsync(string userId, string boardId, string permission);
        Task<List<string>> GetUserSystemPermissionsAsync(string userId);
        Task<Dictionary<string, List<string>>> GetUserBoardPermissionsAsync(string userId);
    }
}