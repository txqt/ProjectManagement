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

        public ColumnService(ApplicationDbContext context, IMapper mapper,
            IBoardNotificationService boardNotificationService)
        {
            _context = context;
            _mapper = mapper;
            _boardNotificationService = boardNotificationService;
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

            await _boardNotificationService.BroadcastColumnCreated(boardId, createdColumn, userId);

            return createdColumn!;
        }

        public async Task<ColumnDto?> UpdateColumnAsync(string columnId, UpdateColumnDto updateColumnDto, string userId)
        {
            var column = await _context.Columns
                .Include(c => c.Board)
                .ThenInclude(b => b.Members)
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

            await _boardNotificationService.BroadcastColumnsReordered(boardId, columnIds,
                _mapper.Map<List<ColumnDto>>(columns), userId);
            return true;
        }
    }
}