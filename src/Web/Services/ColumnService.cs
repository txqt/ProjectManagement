using AutoMapper;
using ProjectManagement.Data;
using LexoAlgorithm;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Helpers;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Column;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Services
{
    public class ColumnService : IColumnService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IBoardNotificationService _boardNotificationService;
        private readonly ICacheInvalidationService _cacheInvalidation;

        public ColumnService(ApplicationDbContext context, IMapper mapper,
            IBoardNotificationService boardNotificationService, ICacheInvalidationService cacheInvalidation)
        {
            _context = context;
            _mapper = mapper;
            _boardNotificationService = boardNotificationService;
            _cacheInvalidation = cacheInvalidation;
        }

        public async Task<ColumnDto?> GetColumnAsync(string columnId, string userId)
        {
            var column = await _context.Columns
                .Include(c => c.Board)
                .Include(c => c.Cards)
                .ThenInclude(card => card.Members)
                .ThenInclude(cm => cm.User)
                .Include(c => c.Cards)
                .ThenInclude(card => card.Comments)
                .ThenInclude(comment => comment.User)
                .Include(c => c.Cards)
                .ThenInclude(card => card.Attachments)
                .AsSplitQuery()
                .FirstOrDefaultAsync(c => c.Id == columnId);

            if (column == null)
                return null;

            return BoardResponseHelper.FormatColumnResponse(column, _mapper);
        }

        public async Task<ColumnDto> CreateColumnAsync(string boardId, CreateColumnDto createColumnDto, string userId)
        {
            var board = await _context.Boards
                .Include(b => b.Members)
                .Include(b => b.Columns)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null)
                throw new UnauthorizedAccessException("Access denied");

            var column = _mapper.Map<Column>(createColumnDto);
            column.Id = Guid.NewGuid().ToString();
            column.BoardId = boardId;
            column.CreatedAt = DateTime.UtcNow;
            column.LastModified = DateTime.UtcNow;

            // Generate LexoRank for new column
            var lastColumn = board.Columns.OrderByDescending(c => c.Rank).FirstOrDefault();
            if (lastColumn != null && !string.IsNullOrEmpty(lastColumn.Rank))
            {
                var lastRank = LexoRank.Parse(lastColumn.Rank);
                column.Rank = lastRank.GenNext().ToString();
            }
            else
            {
                column.Rank = LexoRank.Middle().ToString();
            }

            _context.Columns.Add(column);
            await _context.SaveChangesAsync();

            var createdColumn = await GetColumnAsync(column.Id, userId);
            if (createdColumn == null)
            {
                return null;
            }

            await _cacheInvalidation.InvalidateColumnCachesAsync(column.Id, boardId);

            await _boardNotificationService.BroadcastColumnCreated(boardId, createdColumn, userId);

            return createdColumn!;
        }

        public async Task<ColumnDto?> UpdateColumnAsync(string columnId, UpdateColumnDto updateColumnDto, string userId)
        {
            var column = await _context.Columns
                .Include(c => c.Board)
                .ThenInclude(b => b.Members)
                .Include(c => c.Cards)
                .ThenInclude(c => c.Labels)
                .ThenInclude(c => c.Label)
                .Include(c => c.Cards)
                .ThenInclude(c => c.Members)
                .ThenInclude(cm => cm.User)
                .Include(c => c.Cards)
                .ThenInclude(c => c.Comments)
                .ThenInclude(comment => comment.User)
                .Include(c => c.Cards)
                .ThenInclude(c => c.Attachments)
                .Include(c => c.Cards)
                .ThenInclude(c => c.Checklists)
                .ThenInclude(cl => cl.Items)
                .FirstOrDefaultAsync(c => c.Id == columnId);

            if (column == null)
                return null;

            _mapper.Map(updateColumnDto, column);
            column.LastModified = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var updatedColumn = await GetColumnAsync(column.Id, userId);
            if (updatedColumn == null)
            {
                return null;
            }

            await _cacheInvalidation.InvalidateColumnCachesAsync(column.Id, column.BoardId);

            await _boardNotificationService.BroadcastColumnUpdated(updatedColumn.BoardId, updatedColumn, userId);

            return updatedColumn!;
        }

        public async Task<ColumnDto?> DeleteColumnAsync(string columnId, string userId)
        {
            var column = await _context.Columns
                .Include(c => c.Board)
                .ThenInclude(b => b.Members)
                .FirstOrDefaultAsync(c => c.Id == columnId);

            if (column == null)
                return null;

            _context.Columns.Remove(column);
            await _context.SaveChangesAsync();

            var columnDto = _mapper.Map<ColumnDto>(column);

            await _cacheInvalidation.InvalidateColumnCachesAsync(columnId, column.BoardId);

            await _boardNotificationService.BroadcastColumnDeleted(column.BoardId, column.Id, userId);
            return columnDto;
        }

        public async Task<bool> ReorderColumnsAsync(string boardId, List<string> columnIds, string userId)
        {
            var board = await _context.Boards
                .Include(b => b.Members)
                .Include(b => b.Columns)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null)
                return false;

            var columns = await _context.Columns
                .Include(c => c.Cards)
                .ThenInclude(c => c.Members)
                .Where(c => columnIds.Contains(c.Id))
                .ToListAsync();

            if (columns.Count != columnIds.Count)
                return false;

            // Recalculate ranks based on new order
            for (int i = 0; i < columnIds.Count; i++)
            {
                var column = columns.First(c => c.Id == columnIds[i]);
                if (i == 0)
                {
                    column.Rank = LexoRank.Min().ToString();
                }
                else
                {
                    var prevColumn = columns.First(c => c.Id == columnIds[i - 1]);
                    var prevRank = LexoRank.Parse(prevColumn.Rank);
                    column.Rank = prevRank.GenNext().ToString();
                }

                column.LastModified = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            await _cacheInvalidation.InvalidateBoardCachesAsync(boardId);

            await _boardNotificationService.BroadcastColumnsReordered(boardId, columnIds,
                _mapper.Map<List<ColumnDto>>(columns), userId);
            return true;
        }

        public async Task<ColumnDto> CloneColumnAsync(
            string boardId,
            string columnId,
            CloneColumnDto cloneDto,
            string userId)
        {
            var sourceColumn = await _context.Columns
                .Include(c => c.Cards)
                .ThenInclude(c => c.Members)
                .Include(c => c.Cards)
                .ThenInclude(card => card.Labels)
                .ThenInclude(cl => cl.Label)
                .Include(c => c.Cards)
                .ThenInclude(card => card.Checklists)
                .ThenInclude(checklist => checklist.Items)
                .Include(c => c.Cards)
                .ThenInclude(card => card.Attachments)
                .Include(c => c.Cards)
                .ThenInclude(c => c.Comments)
                .FirstOrDefaultAsync(c => c.Id == columnId && c.BoardId == boardId);

            if (sourceColumn == null)
                throw new ArgumentException("Column not found");

            // Get last column rank
            var lastColumn = await _context.Columns
                .Where(c => c.BoardId == boardId)
                .OrderByDescending(c => c.Rank)
                .FirstOrDefaultAsync();

            var newRank = lastColumn != null
                ? LexoRank.Parse(lastColumn.Rank).GenNext().ToString()
                : LexoRank.Middle().ToString();

            var newColumn = new Column
            {
                Id = Guid.NewGuid().ToString(),
                BoardId = boardId,
                Title = cloneDto.Title,
                Rank = newRank,
                CreatedAt = DateTime.UtcNow,
                LastModified = DateTime.UtcNow
            };

            _context.Columns.Add(newColumn);

            if (cloneDto.IncludeCards)
            {
                foreach (var sourceCard in sourceColumn.Cards.OrderBy(c => c.Rank))
                {
                    var newCard = new Card
                    {
                        Id = Guid.NewGuid().ToString(),
                        BoardId = boardId,
                        ColumnId = newColumn.Id,
                        Title = sourceCard.Title,
                        Description = sourceCard.Description,
                        Cover = sourceCard.Cover,
                        Rank = sourceCard.Rank,
                        CreatedAt = DateTime.UtcNow,
                        LastModified = DateTime.UtcNow
                    };

                    _context.Cards.Add(newCard);

                    //Clone members
                    foreach (var cardMember in sourceCard.Members)
                    {
                        _context.CardMembers.Add(new CardMember
                        {
                            Id = Guid.NewGuid().ToString(), CardId = newCard.Id, UserId = cardMember.UserId
                        });
                    }

                    // Clone labels
                    foreach (var cardLabel in sourceCard.Labels)
                    {
                        _context.CardLabels.Add(new CardLabel
                        {
                            Id = Guid.NewGuid().ToString(), CardId = newCard.Id, LabelId = cardLabel.LabelId
                        });
                    }

                    // Clone checklists
                    foreach (var sourceChecklist in sourceCard.Checklists)
                    {
                        var newChecklist = new Checklist
                        {
                            Id = Guid.NewGuid().ToString(),
                            CardId = newCard.Id,
                            Title = sourceChecklist.Title,
                            Position = sourceChecklist.Position
                        };

                        _context.Checklists.Add(newChecklist);

                        foreach (var sourceItem in sourceChecklist.Items)
                        {
                            _context.ChecklistItems.Add(new ChecklistItem
                            {
                                Id = Guid.NewGuid().ToString(),
                                ChecklistId = newChecklist.Id,
                                Title = sourceItem.Title,
                                IsCompleted = false,
                                Position = sourceItem.Position
                            });
                        }
                    }

                    //Clone attachments
                    foreach (var sourceAttachment in sourceCard.Attachments)
                    {
                        var newAttachment = new Attachment
                        {
                            Id = Guid.NewGuid().ToString(),
                            CardId = newCard.Id,
                            Name = sourceAttachment.Name,
                            Url = sourceAttachment.Url,
                            Type = sourceAttachment.Type,
                            CreatedAt = DateTime.UtcNow,
                            LastModified = DateTime.UtcNow
                        };
                        _context.Attachments.Add(newAttachment);
                    }

                    //Clone comments
                    foreach (var sourceComment in sourceCard.Comments)
                    {
                        var newComment = new Comment
                        {
                            Id = Guid.NewGuid().ToString(),
                            CardId = newCard.Id,
                            UserId = sourceComment.UserId,
                            Content = sourceComment.Content,
                            CreatedAt = DateTime.UtcNow,
                            LastModified = DateTime.UtcNow
                        };
                        _context.Comments.Add(newComment);
                    }
                }
            }

            await _context.SaveChangesAsync();
            await _cacheInvalidation.InvalidateColumnCachesAsync(newColumn.Id, boardId);

            return await GetColumnAsync(newColumn.Id, userId);
        }
    }
}