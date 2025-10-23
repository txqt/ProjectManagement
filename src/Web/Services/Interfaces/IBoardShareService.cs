using ProjectManagement.Models.DTOs.Board;

namespace ProjectManagement.Services.Interfaces
{
    public interface IBoardShareService
    {
        Task<string> GenerateShareTokenAsync(string boardId, string userId);
        Task<BoardDto?> ValidateShareTokenAsync(string token);
        Task<bool> RevokeShareTokenAsync(string boardId, string userId);
    }
}