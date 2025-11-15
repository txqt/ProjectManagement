using AutoMapper;
using ProjectManagement.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Authorization;
using ProjectManagement.Helpers;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Board;
using ProjectManagement.Models.DTOs.Common;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Services
{
    public class BoardService : IBoardService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ICacheService _cache;

        public BoardService(
            ApplicationDbContext context,
            IMapper mapper,
            UserManager<ApplicationUser> userManager, ICacheService cache)
        {
            _context = context;
            _mapper = mapper;
            _userManager = userManager;
            _cache = cache;
        }

        public async Task<PaginatedResult<BoardDto>> GetUserBoardsAsync(
            string userId,
            PaginationParams paginationParams,
            string? search = null,
            string? sortBy = null,
            string? sortOrder = null)
        {
            var cacheKey =
                $"user_boards:{userId}:page_{paginationParams.Page}:size_{paginationParams.PageSize}:search_{search}:sort_{sortBy}_{sortOrder}";
            var cached = await _cache.GetAsync<PaginatedResult<BoardDto>>(cacheKey);
            if (cached != null) return cached;

            // Base query
            var query = _context.Boards
                .Include(b => b.Owner)
                .Include(b => b.Members)
                .ThenInclude(m => m.User)
                .Where(b => b.OwnerId == userId || b.Members.Any(m => m.UserId == userId));

            // Search filter
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(b =>
                    b.Title.ToLower().Contains(searchLower) ||
                    (b.Description != null && b.Description.ToLower().Contains(searchLower)));
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Sorting
            query = (sortBy?.ToLower(), sortOrder?.ToLower()) switch
            {
                ("title", "asc") => query.OrderBy(b => b.Title),
                ("title", "desc") => query.OrderByDescending(b => b.Title),
                ("createdat", "asc") => query.OrderBy(b => b.CreatedAt),
                ("createdat", "desc") => query.OrderByDescending(b => b.CreatedAt),
                ("lastmodified", "asc") => query.OrderBy(b => b.LastModified),
                _ => query.OrderByDescending(b => b.LastModified) // default
            };

            // Pagination
            var boards = await query
                .Skip((paginationParams.Page - 1) * paginationParams.PageSize)
                .Take(paginationParams.PageSize)
                .AsSplitQuery()
                .ToListAsync();

            // For each board, load related data
            var boardDtos = new List<BoardDto>();
            foreach (var board in boards)
            {
                // Load columns with cards and nested data
                await _context.Entry(board)
                    .Collection(b => b.Columns)
                    .Query()
                    .Include(c => c.Cards)
                    .ThenInclude(card => card.Members)
                    .ThenInclude(cm => cm.User)
                    .Include(c => c.Cards)
                    .ThenInclude(card => card.Comments)
                    .ThenInclude(comment => comment.User)
                    .Include(c => c.Cards)
                    .ThenInclude(card => card.Attachments)
                    .LoadAsync();

                boardDtos.Add(_mapper.Map<BoardDto>(board));
            }

            var result = new PaginatedResult<BoardDto>
            {
                Items = boardDtos,
                Page = paginationParams.Page,
                PageSize = paginationParams.PageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)paginationParams.PageSize)
            };

            await _cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(5));

            return result;
        }

        public async Task<BoardDto?> GetBoardAsync(string boardId, string userId)
        {
            var cacheKey = $"board:{boardId}";
            var cached = await _cache.GetAsync<BoardDto>(cacheKey);
            if (cached != null) return cached;

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
                .Include(b => b.Columns)
                .ThenInclude(c => c.Cards)
                .ThenInclude(card => card.Labels)
                .ThenInclude(cl => cl.Label) // CardLabel -> Label
                .Include(b => b.Columns)
                .ThenInclude(c => c.Cards)
                .ThenInclude(card => card.Checklists)
                .ThenInclude(checklist => checklist.Items)
                // .ThenInclude(item => item.CompletedByUser) // Optional: user who completed
                .AsSplitQuery()
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null)
                return null;

            var result = BoardResponseHelper.FormatBoardResponse(board, _mapper);
            await _cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(10));

            return result;
        }

        public async Task<BoardDto> CreateBoardAsync(CreateBoardDto createBoardDto, string userId)
        {
            var board = _mapper.Map<Board>(createBoardDto);
            board.OwnerId = userId;
            board.Id = Guid.NewGuid().ToString();
            board.CreatedAt = DateTime.UtcNow;
            board.LastModified = DateTime.UtcNow;

            _context.Boards.Add(board);
            await _context.SaveChangesAsync();

            // Load the board with related data
            var createdBoard = await _context.Boards
                .Include(b => b.Owner)
                .Include(b => b.Members)
                .ThenInclude(m => m.User)
                .FirstOrDefaultAsync(b => b.Id == board.Id);

            await InvalidateUserBoardsCache(userId);

            return _mapper.Map<BoardDto>(createdBoard);
        }

        public async Task<BoardDto?> UpdateBoardAsync(string boardId, UpdateBoardDto updateBoardDto, string userId)
        {
            var board = await _context.Boards.FirstOrDefaultAsync(b => b.Id == boardId);
            if (board == null)
                return null;

            _mapper.Map(updateBoardDto, board);
            board.LastModified = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await InvalidateBoardCache(boardId);
            await InvalidateUserBoardsCache(userId);

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

        public async Task<BoardMemberDto?> AddMemberAsync(string boardId, AddBoardMemberDto addMemberDto,
            string currentUserId)
        {
            var board = await _context.Boards
                .Include(b => b.Members)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null)
                throw new ArgumentException("Board not found");

            var user = await _userManager.FindByEmailAsync(addMemberDto.Email);
            if (user == null)
                throw new ArgumentException("User not found");

            // Check if user is already a member
            var existingMember = await _context.BoardMembers
                .FirstOrDefaultAsync(bm => bm.BoardId == boardId && bm.UserId == user.Id);

            if (existingMember != null)
                throw new InvalidOperationException("User is already a member of this board");

            // Validate role
            if (!RoleHierarchy.IsValidBoardRole(addMemberDto.Role))
                throw new ArgumentException($"Invalid role: {addMemberDto.Role}");

            // Lấy role của current user
            string currentUserRole;
            if (board.OwnerId == currentUserId)
            {
                currentUserRole = RoleHierarchy.Owner;
            }
            else
            {
                var currentUserMembership = board.Members.FirstOrDefault(m => m.UserId == currentUserId);
                if (currentUserMembership == null)
                    throw new UnauthorizedAccessException("You are not a member of this board");

                currentUserRole = currentUserMembership.Role;
            }

            // Kiểm tra có thể assign role này không
            if (addMemberDto.Role.ToLower() == RoleHierarchy.Owner)
                throw new InvalidOperationException(
                    "Cannot assign Owner role. Use transfer ownership feature instead.");

            if (!RoleHierarchy.IsBoardRoleHigherThan(currentUserRole, addMemberDto.Role))
                throw new UnauthorizedAccessException(
                    $"You can only add members with roles lower than your role '{currentUserRole}'");

            var member = new BoardMember
            {
                Id = Guid.NewGuid().ToString(),
                BoardId = boardId,
                UserId = user.Id,
                Role = addMemberDto.Role.ToLower(),
                JoinedAt = DateTime.UtcNow
            };

            _context.BoardMembers.Add(member);
            await _context.SaveChangesAsync();

            var createdMember = await _context.BoardMembers
                .Include(bm => bm.User)
                .FirstOrDefaultAsync(bm => bm.Id == member.Id);

            await InvalidateBoardCache(boardId);
            await InvalidateUserBoardsCache(currentUserId);
            await InvalidateUserBoardsCache(user.Id);

            return _mapper.Map<BoardMemberDto>(createdMember);
        }

        public async Task<bool> RemoveMemberAsync(string boardId, string memberId, string currentUserId)
        {
            var board = await _context.Boards
                .Include(b => b.Members)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null)
                throw new ArgumentException("Board not found");

            var targetMember = await _context.BoardMembers
                .FirstOrDefaultAsync(bm => bm.Id == memberId && bm.BoardId == boardId);

            if (targetMember == null)
                throw new ArgumentException("Member not found");

            // Lấy role của current user
            string currentUserRole;
            if (board.OwnerId == currentUserId)
            {
                currentUserRole = RoleHierarchy.Owner;
            }
            else
            {
                var currentUserMembership = board.Members.FirstOrDefault(m => m.UserId == currentUserId);
                if (currentUserMembership == null)
                    throw new UnauthorizedAccessException("You are not a member of this board");

                currentUserRole = currentUserMembership.Role;
            }

            // Kiểm tra có phải tự remove không
            bool isSelfRemoval = targetMember.UserId == currentUserId;

            // Kiểm tra hierarchy
            var (canRemove, reason) = RoleHierarchy.CanRemoveBoardMember(
                currentUserRole,
                targetMember.Role,
                isSelfRemoval
            );

            if (!canRemove)
                throw new UnauthorizedAccessException(reason);

            var targetUserId = targetMember.UserId;

            _context.BoardMembers.Remove(targetMember);
            await _context.SaveChangesAsync();

            await InvalidateBoardCache(boardId);
            await InvalidateUserBoardsCache(currentUserId);
            await InvalidateUserBoardsCache(targetUserId);

            return true;
        }

        public async Task<bool> UpdateMemberRoleAsync(string boardId, string memberId, string newRole,
            string currentUserId)
        {
            var board = await _context.Boards
                .Include(b => b.Members)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null)
                throw new ArgumentException("Board not found");

            var targetMember = await _context.BoardMembers
                .FirstOrDefaultAsync(bm => bm.Id == memberId && bm.BoardId == boardId);

            if (targetMember == null)
                throw new ArgumentException("Member not found");

            // Validate role
            if (!RoleHierarchy.IsValidBoardRole(newRole))
                throw new ArgumentException($"Invalid role: {newRole}");

            // Lấy role của current user
            string currentUserRole;
            if (board.OwnerId == currentUserId)
            {
                currentUserRole = RoleHierarchy.Owner;
            }
            else
            {
                var currentUserMembership = board.Members.FirstOrDefault(m => m.UserId == currentUserId);
                if (currentUserMembership == null)
                    throw new UnauthorizedAccessException("You are not a member of this board");

                currentUserRole = currentUserMembership.Role;
            }

            // Kiểm tra có phải tự thay đổi role của mình không
            bool isSelfChange = targetMember.UserId == currentUserId;

            if (isSelfChange)
                throw new InvalidOperationException("You cannot change your own role");

            // Kiểm tra hierarchy
            var (canChange, reason) = RoleHierarchy.CanChangeBoardMemberRole(
                currentUserRole,
                targetMember.Role,
                newRole
            );

            if (!canChange)
                throw new UnauthorizedAccessException(reason);

            // Cập nhật role
            targetMember.Role = newRole;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task TransferOwnershipAsync(string boardId, string newOwnerId, string currentUserId)
        {
            var board = await _context.Boards
                .Include(b => b.Members)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null)
                throw new ArgumentException("Board not found");

            // Chỉ owner hiện tại mới có thể transfer
            if (board.OwnerId != currentUserId)
                throw new UnauthorizedAccessException("Only the board owner can transfer ownership");

            // Không thể transfer cho chính mình
            if (newOwnerId == currentUserId)
                throw new InvalidOperationException("Cannot transfer ownership to yourself");

            // Kiểm tra new owner có tồn tại không
            var newOwner = await _userManager.FindByIdAsync(newOwnerId);
            if (newOwner == null)
                throw new ArgumentException("New owner user not found");

            // Kiểm tra new owner có phải là member không
            var newOwnerMembership = board.Members.FirstOrDefault(m => m.UserId == newOwnerId);
            if (newOwnerMembership == null)
                throw new InvalidOperationException("New owner must be a member of the board first");

            // Chuyển ownership
            // 1. Owner cũ thành admin
            var oldOwnerMembership = new BoardMember
            {
                Id = Guid.NewGuid().ToString(),
                BoardId = boardId,
                UserId = currentUserId,
                Role = RoleHierarchy.BoardAdmin,
                JoinedAt = DateTime.UtcNow
            };
            _context.BoardMembers.Add(oldOwnerMembership);

            // 2. Remove membership của new owner (vì sẽ trở thành owner)
            _context.BoardMembers.Remove(newOwnerMembership);

            // 3. Update board owner
            board.OwnerId = newOwnerId;
            board.LastModified = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        private async Task InvalidateUserBoardsCache(string userId)
        {
            await _cache.RemoveAsync($"user_boards:{userId}");
        }

        private async Task InvalidateBoardCache(string boardId)
        {
            await _cache.RemoveAsync($"board:{boardId}");
        }
    }
}