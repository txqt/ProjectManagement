using AutoMapper;
using Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Helpers;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Board;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Services
{
    public class BoardService : IBoardService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly UserManager<ApplicationUser> _userManager;

        public BoardService(
            ApplicationDbContext context,
            IMapper mapper,
            UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _mapper = mapper;
            _userManager = userManager;
        }

        public async Task<IEnumerable<BoardDto>> GetUserBoardsAsync(string userId)
        {
            var boards = await _context.Boards
                .Include(b => b.Owner)
                .Include(b => b.Members)
                    .ThenInclude(m => m.User)
                .Include(b => b.Columns)
                    .ThenInclude(c => c.Cards)
                        .ThenInclude(card => card.Members)
                            .ThenInclude(cm => cm.User)
                .Include(b => b.Columns)
                    .ThenInclude(c => c.Cards)
                        .ThenInclude(card => card.Comments)
                            .ThenInclude(comment => comment.User)
                .Include(b => b.Columns)
                    .ThenInclude(c => c.Cards)
                        .ThenInclude(card => card.Attachments)
                .Where(b => b.OwnerId == userId || b.Members.Any(m => m.UserId == userId))
                .AsSplitQuery()
                .ToListAsync();

            return _mapper.Map<IEnumerable<BoardDto>>(boards);
        }

        public async Task<BoardDto?> GetBoardAsync(string boardId, string userId)
        {
            var board = await _context.Boards
                .Include(b => b.Owner)
                .Include(b => b.Members)
                    .ThenInclude(m => m.User)
                .Include(b => b.Columns)
                    .ThenInclude(c => c.Cards)
                        .ThenInclude(card => card.Members)
                            .ThenInclude(cm => cm.User)
                .Include(b => b.Columns)
                    .ThenInclude(c => c.Cards)
                        .ThenInclude(card => card.Comments)
                            .ThenInclude(comment => comment.User)
                .Include(b => b.Columns)
                    .ThenInclude(c => c.Cards)
                        .ThenInclude(card => card.Attachments)
                .AsSplitQuery()
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null || !HasBoardAccess(board, userId))
                return null;

            return BoardResponseHelper.FormatBoardResponse(board, _mapper);;
        }

        public async Task<BoardDto> CreateBoardAsync(CreateBoardDto createBoardDto, string userId)
        {
            var board = _mapper.Map<Board>(createBoardDto);
            board.OwnerId = userId;
            board.Id = Guid.NewGuid().ToString();
            board.Created = DateTime.UtcNow;
            board.LastModified = DateTime.UtcNow;

            _context.Boards.Add(board);
            await _context.SaveChangesAsync();

            // Load the board with related data
            var createdBoard = await _context.Boards
                .Include(b => b.Owner)
                .Include(b => b.Members)
                    .ThenInclude(m => m.User)
                .FirstOrDefaultAsync(b => b.Id == board.Id);

            return _mapper.Map<BoardDto>(createdBoard);
        }

        public async Task<BoardDto?> UpdateBoardAsync(string boardId, UpdateBoardDto updateBoardDto, string userId)
        {
            var board = await _context.Boards.FirstOrDefaultAsync(b => b.Id == boardId);
            if (board == null || !CanEditBoard(board, userId))
                return null;

            _mapper.Map(updateBoardDto, board);
            board.LastModified = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var updatedBoard = await GetBoardAsync(boardId, userId);
            return updatedBoard;
        }

        public async Task<bool> DeleteBoardAsync(string boardId, string userId)
        {
            var board = await _context.Boards.FirstOrDefaultAsync(b => b.Id == boardId);
            if (board == null || board.OwnerId != userId)
                return false;

            _context.Boards.Remove(board);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<BoardMemberDto?> AddMemberAsync(string boardId, AddBoardMemberDto addMemberDto, string userId)
        {
            var board = await _context.Boards.FirstOrDefaultAsync(b => b.Id == boardId);
            if (board == null || !CanManageBoardMembers(board, userId))
                return null;

            var user = await _userManager.FindByEmailAsync(addMemberDto.Email);
            if (user == null)
                return null;

            // Check if user is already a member
            var existingMember = await _context.BoardMembers
                .FirstOrDefaultAsync(bm => bm.BoardId == boardId && bm.UserId == user.Id);
            if (existingMember != null)
                return null;

            var member = new BoardMember
            {
                Id = Guid.NewGuid().ToString(),
                BoardId = boardId,
                UserId = user.Id,
                Role = addMemberDto.Role,
                JoinedAt = DateTime.UtcNow
            };

            _context.BoardMembers.Add(member);
            await _context.SaveChangesAsync();

            var createdMember = await _context.BoardMembers
                .Include(bm => bm.User)
                .FirstOrDefaultAsync(bm => bm.Id == member.Id);

            return _mapper.Map<BoardMemberDto>(createdMember);
        }

        public async Task<bool> RemoveMemberAsync(string boardId, string memberId, string userId)
        {
            var board = await _context.Boards.FirstOrDefaultAsync(b => b.Id == boardId);
            if (board == null || !CanManageBoardMembers(board, userId))
                return false;

            var member = await _context.BoardMembers
                .FirstOrDefaultAsync(bm => bm.Id == memberId && bm.BoardId == boardId);
            if (member == null)
                return false;

            _context.BoardMembers.Remove(member);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateMemberRoleAsync(string boardId, string memberId, string role, string userId)
        {
            var board = await _context.Boards.FirstOrDefaultAsync(b => b.Id == boardId);
            if (board == null || !CanManageBoardMembers(board, userId))
                return false;

            var member = await _context.BoardMembers
                .FirstOrDefaultAsync(bm => bm.Id == memberId && bm.BoardId == boardId);
            if (member == null)
                return false;

            member.Role = role;
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

        private bool CanManageBoardMembers(Board board, string userId)
        {
            return board.OwnerId == userId ||
                   board.Members.Any(m => m.UserId == userId && (m.Role == "admin" || m.Role == "owner"));
        }
    }
}
