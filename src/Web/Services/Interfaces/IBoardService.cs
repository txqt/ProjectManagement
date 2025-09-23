using ProjectManagement.Models.DTOs.Board;

namespace ProjectManagement.Services.Interfaces
{
    public interface IBoardService
    {
        Task<IEnumerable<BoardDto>> GetUserBoardsAsync(string userId);
        Task<BoardDto?> GetBoardAsync(string boardId, string userId);
        Task<BoardDto> CreateBoardAsync(CreateBoardDto createBoardDto, string userId);
        Task<BoardDto?> UpdateBoardAsync(string boardId, UpdateBoardDto updateBoardDto, string userId);
        Task<bool> DeleteBoardAsync(string boardId, string userId);
        Task<BoardMemberDto?> AddMemberAsync(string boardId, AddBoardMemberDto addMemberDto, string userId);
        Task<bool> RemoveMemberAsync(string boardId, string memberId, string userId);
        Task<bool> UpdateMemberRoleAsync(string boardId, string memberId, string role, string userId);
    }
}
