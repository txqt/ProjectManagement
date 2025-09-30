using AutoMapper;
using Infrastructure;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Column;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Services
{
    public class ColumnService : IColumnService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public ColumnService(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
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

            if (column == null || !HasBoardAccess(column.Board, userId))
                return null;

            return _mapper.Map<ColumnDto>(column);
        }

        public async Task<ColumnDto> CreateColumnAsync(string boardId, CreateColumnDto createColumnDto, string userId)
        {
            var board = await _context.Boards
                .Include(b => b.Members)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null || !CanEditBoard(board, userId))
                throw new UnauthorizedAccessException("Access denied");

            var column = _mapper.Map<Column>(createColumnDto);
            column.Id = Guid.NewGuid().ToString();
            column.BoardId = boardId;
            column.Created = DateTime.UtcNow;
            column.LastModified = DateTime.UtcNow;

            _context.Columns.Add(column);

            // Update board's column order
            board.ColumnOrderIds.Add(column.Id);
            board.LastModified = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var createdColumn = await GetColumnAsync(column.Id, userId);
            return createdColumn!;
        }

        public async Task<ColumnDto?> UpdateColumnAsync(string columnId, UpdateColumnDto updateColumnDto, string userId)
        {
            var column = await _context.Columns
                .Include(c => c.Board)
                    .ThenInclude(b => b.Members)
                .FirstOrDefaultAsync(c => c.Id == columnId);

            if (column == null || !CanEditBoard(column.Board, userId))
                return null;

            _mapper.Map(updateColumnDto, column);
            column.LastModified = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetColumnAsync(columnId, userId);
        }

        public async Task<ColumnDto?> DeleteColumnAsync(string columnId, string userId)
        {
            var column = await _context.Columns
                .Include(c => c.Board)
                    .ThenInclude(b => b.Members)
                .FirstOrDefaultAsync(c => c.Id == columnId);

            if (column == null || !CanEditBoard(column.Board, userId))
                return null;

            // Remove column from board's order
            var board = column.Board;
            board.ColumnOrderIds.Remove(columnId);
            board.LastModified = DateTime.UtcNow;

            _context.Columns.Remove(column);
            await _context.SaveChangesAsync();

            var columnDto = _mapper.Map<ColumnDto>(column);

            return columnDto;
        }

        public async Task<bool> ReorderColumnsAsync(string boardId, List<string> columnOrderIds, string userId)
        {
            var board = await _context.Boards
                .Include(b => b.Members)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null || !CanEditBoard(board, userId))
                return false;

            board.ColumnOrderIds = columnOrderIds;
            board.LastModified = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        private bool HasBoardAccess(Board board, string userId)
        {
            return board.OwnerId == userId ||
                   board.Members.Any(m => m.UserId == userId) ||
                   board.Type == "public";
        }

        private bool CanEditBoard(Board board, string userId)
        {
            return board.OwnerId == userId ||
                   board.Members.Any(m => m.UserId == userId && (m.Role == "admin" || m.Role == "owner"));
        }
    }
}
