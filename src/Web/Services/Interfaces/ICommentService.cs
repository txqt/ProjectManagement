using ProjectManagement.Models.DTOs.Comment;

namespace ProjectManagement.Services.Interfaces;

public interface ICommentService
{
    Task<IEnumerable<CommentDto>> GetCommentsAsync(string cardId);
    Task<CommentDto> CreateCommentAsync(string cardId, CreateCommentDto createCommentDto, string userId);
    Task<CommentDto?> UpdateCommentAsync(string commentId, UpdateCommentDto updateCommentDto, string userId);
    Task<bool> DeleteCommentAsync(string commentId, string userId);
}