using ProjectManagement.Models.DTOs.Board;
using ProjectManagement.Models.DTOs.BoardShare;

namespace ProjectManagement.Services.Interfaces
{
    public interface IBoardShareService
    {
        Task<ShareTokenResponseDto?> GetActiveShareTokenAsync(string boardId);
        Task<ShareTokenResponseDto> GenerateShareTokenAsync(string boardId);
        Task<JoinBoardResponseDto> JoinBoardViaTokenAsync(string userId, JoinViaTokenDto dto);
    }
}