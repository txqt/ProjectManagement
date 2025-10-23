using ProjectManagement.Models.DTOs.BoardJoinRequest;

namespace ProjectManagement.Services.Interfaces
{
    public interface IBoardJoinRequestService
    {
        Task<BoardJoinRequestDto> CreateJoinRequestAsync(string boardId, CreateBoardJoinRequestDto dto, string userId);
        Task<IEnumerable<BoardJoinRequestDto>> GetBoardJoinRequestsAsync(string boardId, string userId, string? status = null);
        Task<IEnumerable<BoardJoinRequestDto>> GetUserJoinRequestsAsync(string userId, string? status = null);
        Task<JoinRequestResponseDto> RespondToJoinRequestAsync(string requestId, RespondToJoinRequestDto dto, string responderId);
        Task<bool> CancelJoinRequestAsync(string requestId, string userId);
        Task<BoardJoinRequestDto?> GetJoinRequestAsync(string requestId);
    }
}