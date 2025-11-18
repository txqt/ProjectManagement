using AutoMapper;
using Microsoft.AspNetCore.Identity;
using ProjectManagement.Data;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Helpers;
using ProjectManagement.Models.Common;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.BoardJoinRequest;
using ProjectManagement.Models.DTOs.BoardShare;
using ProjectManagement.Models.DTOs.Notification;
using ProjectManagement.Services.Interfaces;
using System.Security.Cryptography;

namespace ProjectManagement.Services
{
    public class BoardShareService : IBoardShareService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ICacheService _cache;
        private readonly UserManager<ApplicationUser>  _userManager;
        private readonly INotificationService _notificationService;
        private readonly IBoardNotificationService _boardNotificationService;
        private readonly IMapper  _mapper;
        private readonly ICacheInvalidationService _cacheInvalidation;

        public BoardShareService(ApplicationDbContext context, IConfiguration configuration, ICacheService cache, UserManager<ApplicationUser> userManager, INotificationService notificationService, IBoardNotificationService boardNotificationService, IMapper mapper, ICacheInvalidationService cacheInvalidation)
        {
            _context = context;
            _configuration = configuration;
            _cache = cache;
            _userManager = userManager;
            _notificationService = notificationService;
            _boardNotificationService = boardNotificationService;
            _mapper = mapper;
            _cacheInvalidation = cacheInvalidation;
        }

        public async Task<ShareTokenResponseDto?> GetActiveShareTokenAsync(string boardId)
        {
            var cacheKey = $"ActiveShareToken:{boardId}";
            var cached = await _cache.GetAsync<ShareTokenResponseDto>(cacheKey);
            if (cached != null) return cached;

            var activeToken = await _context.BoardShareTokens
                .Where(t => t.BoardId == boardId && t.IsActive && t.ExpiresAt > DateTime.UtcNow)
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();

            if (activeToken == null)
                return null;

            var result = new ShareTokenResponseDto
            {
                Token = activeToken.Token,
                ExpiresAt = activeToken.ExpiresAt,
                ShareUrl = $"{_configuration["ClientUrl"]}/join?token={activeToken.Token}"
            };

            await _cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(10));
            return result;
        }

        public async Task<ShareTokenResponseDto> GenerateShareTokenAsync(string boardId)
        {
            // Deactivate old tokens
            var oldTokens = await _context.BoardShareTokens
                .Where(t => t.BoardId == boardId && t.IsActive)
                .ToListAsync();

            oldTokens.ForEach(t => t.IsActive = false);

            // Generate new token
            var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));

            var shareToken = new BoardShareToken
            {
                Id = Guid.NewGuid().ToString(),
                BoardId = boardId,
                Token = token,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                IsActive = true
            };

            _context.BoardShareTokens.Add(shareToken);
            await _context.SaveChangesAsync();
            
            await _cache.RemoveAsync(CacheKeys.ActiveShareToken(boardId));

            return new ShareTokenResponseDto
            {
                Token = token,
                ExpiresAt = shareToken.ExpiresAt,
                ShareUrl = $"{_configuration["ClientUrl"]}/join?token={token}"
            };
        }

        public async Task<JoinBoardResponseDto> JoinBoardViaTokenAsync(string userId, JoinViaTokenDto dto)
        {
            var shareToken = await _context.BoardShareTokens
                .Include(t => t.Board)
                .ThenInclude(b => b.Members)
                .FirstOrDefaultAsync(t => t.Token == dto.Token && t.IsActive);

            if (shareToken == null || shareToken.ExpiresAt < DateTime.UtcNow)
                return new JoinBoardResponseDto { Success = false, Message = "Invalid or expired token" };

            var board = shareToken.Board;

            if (!board.AllowShareInviteLink)
                return new JoinBoardResponseDto { Success = false, Message = "Share invite links are disabled for this board" };

            if (board.Members.Any(m => m.UserId == userId))
                return new JoinBoardResponseDto { Success = true, Message = "Already a member", BoardId = board.Id, Action = "already_member" };

            if (board.Type == BoardType.Public)
            {
                var newMember = new BoardMember
                {
                    Id = Guid.NewGuid().ToString(),
                    BoardId = board.Id,
                    UserId = userId,
                    Role = "member",
                    JoinedAt = DateTime.UtcNow
                };
                _context.BoardMembers.Add(newMember);
                await _context.SaveChangesAsync();

                return new JoinBoardResponseDto { Success = true, Message = "Successfully joined", BoardId = board.Id, Action = "auto_joined" };
            }

            var existingRequest = await _context.BoardJoinRequests
                .FirstOrDefaultAsync(r => r.BoardId == board.Id && r.UserId == userId && r.Status == JoinRequestStatus.Pending);

            if (existingRequest != null)
                return new JoinBoardResponseDto { Success = true, Message = "Pending request exists", BoardId = board.Id, Action = "request_exists" };

            var joinRequest = new BoardJoinRequest
            {
                Id = Guid.NewGuid().ToString(),
                BoardId = board.Id,
                UserId = userId,
                Message = dto.Message,
                CreatedAt = DateTime.UtcNow,
                Status = JoinRequestStatus.Pending
            };

            _context.BoardJoinRequests.Add(joinRequest);
            await _context.SaveChangesAsync();
            
            await _cacheInvalidation.InvalidateJoinRequestsCacheAsync(board.Id);
            
            // Notify board owner and admins
            var adminIds = board.Members
                .Where(m => string.Equals(m.Role, "admin", StringComparison.OrdinalIgnoreCase) ||
                            string.Equals(m.Role, "owner", StringComparison.OrdinalIgnoreCase))
                .Select(m => m.UserId)
                .ToList();

            if (!adminIds.Contains(board.OwnerId))
                adminIds.Add(board.OwnerId);

            var user = await _userManager.FindByIdAsync(userId);

            foreach (var adminId in adminIds)
            {
                await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                {
                    UserId = adminId,
                    Type = "board_join_request",
                    Title = "New board join request",
                    Message = $"{user?.UserName} wants to join \"{board.Title}\"",
                    ActionUrl = $"/boards/{board.Id}/join-requests",
                    BoardId = board.Id
                });
            }

            var requestDto = _mapper.Map<BoardJoinRequestDto>(joinRequest);
            await _boardNotificationService.BroadcastJoinRequestCreated(board.Id, requestDto);

            return new JoinBoardResponseDto { Success = true, Message = "Join request submitted", BoardId = board.Id, Action = "request_created" };
        }
    }
}