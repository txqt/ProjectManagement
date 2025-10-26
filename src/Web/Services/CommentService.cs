using AutoMapper;
using Infrastructure;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Comment;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Services
{
    public class CommentService : ICommentService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IBoardNotificationService _boardNotificationService;

        public CommentService(
            ApplicationDbContext context,
            IMapper mapper,
            IBoardNotificationService boardNotificationService)
        {
            _context = context;
            _mapper = mapper;
            _boardNotificationService = boardNotificationService;
        }

        public async Task<IEnumerable<CommentDto>> GetCommentsAsync(string cardId)
        {
            var comments = await _context.Comments
                .Include(c => c.User)
                .Where(c => c.CardId == cardId)
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();

            return _mapper.Map<IEnumerable<CommentDto>>(comments);
        }

        public async Task<CommentDto> CreateCommentAsync(string cardId, CreateCommentDto createCommentDto, string userId)
        {
            var card = await _context.Cards
                .Include(c => c.Board)
                .FirstOrDefaultAsync(c => c.Id == cardId);

            if (card == null)
                throw new ArgumentException("Card not found");

            if (card.Board?.AllowCommentsOnCard == false)
            {
                throw new ArgumentException("Card is not allow comments");
            }

            var comment = new Comment
            {
                Id = Guid.NewGuid().ToString(),
                CardId = cardId,
                UserId = userId,
                Content = createCommentDto.Content,
                CreatedAt = DateTime.UtcNow,
                LastModified = DateTime.UtcNow
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            var createdComment = await _context.Comments
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.Id == comment.Id);

            var commentDto = _mapper.Map<CommentDto>(createdComment);

            await _boardNotificationService.BroadcastCommentAdded(
                card.BoardId,
                card.ColumnId,
                cardId,
                commentDto,
                userId
            );

            return commentDto;
        }

        public async Task<CommentDto?> UpdateCommentAsync(string commentId, UpdateCommentDto updateCommentDto, string userId)
        {
            var comment = await _context.Comments
                .Include(c => c.User)
                .Include(c => c.Card)
                .ThenInclude(card => card.Board)
                .FirstOrDefaultAsync(c => c.Id == commentId);

            if (comment == null || comment.UserId != userId)
                return null;

            comment.Content = updateCommentDto.Content;
            comment.LastModified = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var commentDto = _mapper.Map<CommentDto>(comment);

            await _boardNotificationService.BroadcastCommentUpdated(
                comment.Card.BoardId,
                comment.Card.ColumnId,
                comment.CardId,
                commentDto,
                userId
            );

            return commentDto;
        }

        public async Task<bool> DeleteCommentAsync(string commentId, string userId)
        {
            var comment = await _context.Comments
                .Include(c => c.Card)
                .FirstOrDefaultAsync(c => c.Id == commentId);

            if (comment == null || comment.UserId != userId)
                return false;

            var boardId = comment.Card.BoardId;
            var columnId = comment.Card.ColumnId;
            var cardId = comment.CardId;

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();

            await _boardNotificationService.BroadcastCommentDeleted(
                boardId,
                columnId,
                cardId,
                commentId,
                userId
            );

            return true;
        }
    }
}
