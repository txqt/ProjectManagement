using ProjectManagement.Models.DTOs.BoardInvite;

namespace ProjectManagement.Services.Interfaces
{
    public interface IBoardInviteService
    {
        Task<BoardInviteDto> CreateInviteAsync(string boardId, CreateBoardInviteDto createInviteDto, string inviterId);
        Task<IEnumerable<BoardInviteDto>> GetBoardInvitesAsync(string boardId, string userId);
        Task<IEnumerable<BoardInviteDto>> GetUserInvitesAsync(string userId, string? status = null);
        Task<InviteResponseDto> RespondToInviteAsync(string inviteId, RespondToInviteDto responseDto, string userId);
        Task<bool> CancelInviteAsync(string inviteId, string userId);
        Task<BoardInviteDto?> GetInviteAsync(string inviteId);
        Task<bool> ResendInviteAsync(string inviteId, string userId);
        Task CleanupExpiredInvitesAsync();
    }
}
