using ProjectManagement.Models.DTOs.Board;
using ProjectManagement.Models.DTOs.Common;

namespace ProjectManagement.Services.Interfaces
{
    public interface IBoardService
    {
        Task<PaginatedResult<BoardDto>> GetUserBoardsAsync(
            string userId, 
            PaginationParams paginationParams,
            string? search = null,
            string? sortBy = null,
            string? sortOrder = null);
        Task<BoardDto?> GetBoardAsync(string boardId, string userId);
        Task<BoardDto> CreateBoardAsync(CreateBoardDto createBoardDto, string userId);
        Task<BoardDto?> UpdateBoardAsync(string boardId, UpdateBoardDto updateBoardDto, string userId);
        Task<bool> DeleteBoardAsync(string boardId, string userId);
        Task<BoardMemberDto?> AddMemberAsync(string boardId, AddBoardMemberDto addMemberDto, string userId);
        Task<bool> RemoveMemberAsync(string boardId, string memberId, string userId);
        Task<bool> UpdateMemberRoleAsync(string boardId, string memberId, string role, string userId);
        Task TransferOwnershipAsync(string boardId, string newOwnerId, string currentUserId);
        Task<BoardDto> CloneBoardAsync(string boardId, CloneBoardDto cloneBoardDto, string userId);
        Task<bool> SetTypeAsync(string boardId, string boardType, string userId);
        Task<List<BoardDto>> GetTemplatesAsync(string userId);
        Task<BoardDto> CreateFromTemplateAsync(string templateId, CreateBoardFromTemplateDto createDto, string userId);
    }
}
