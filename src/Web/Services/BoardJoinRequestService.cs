using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using ProjectManagement.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Authorization;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.BoardJoinRequest;
using ProjectManagement.Models.DTOs.Notification;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Services
{
    public class BoardJoinRequestService : IBoardJoinRequestService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly INotificationService _notificationService;
        private readonly ILogger<BoardJoinRequestService> _logger;
        private readonly IBoardNotificationService _boardNotificationService;

        public BoardJoinRequestService(
            ApplicationDbContext context,
            IMapper mapper,
            UserManager<ApplicationUser> userManager,
            INotificationService notificationService,
            ILogger<BoardJoinRequestService> logger,
            IBoardNotificationService boardNotificationService)
        {
            _context = context;
            _mapper = mapper;
            _userManager = userManager;
            _notificationService = notificationService;
            _logger = logger;
            _boardNotificationService = boardNotificationService;
        }

        public async Task<BoardJoinRequestDto> CreateJoinRequestAsync(string boardId, CreateBoardJoinRequestDto dto,
            string userId)
        {
            var board = await _context.Boards
                .Include(b => b.Members)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null)
                throw new ArgumentException("Board not found");

            var isMember = board.OwnerId == userId || board.Members.Any(m => m.UserId == userId);
            if (isMember)
                throw new InvalidOperationException("You are already a member of this board");

            var existingRequest = await _context.BoardJoinRequests
                .FirstOrDefaultAsync(r =>
                    r.BoardId == boardId && r.UserId == userId && r.Status == JoinRequestStatus.Pending);

            if (existingRequest != null)
                throw new InvalidOperationException("You already have a pending join request for this board");

            var request = new BoardJoinRequest
            {
                Id = Guid.NewGuid().ToString(),
                BoardId = boardId,
                UserId = userId,
                Message = dto.Message,
                CreatedAt = DateTime.UtcNow,
                Status = JoinRequestStatus.Pending
            };

            _context.BoardJoinRequests.Add(request);
            await _context.SaveChangesAsync();

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
                    ActionUrl = $"/boards/{boardId}/join-requests",
                    BoardId = boardId
                });
            }

            var createdRequest = await _context.BoardJoinRequests
                .Include(r => r.Board)
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == request.Id);

            var requestDto = _mapper.Map<BoardJoinRequestDto>(createdRequest);
            await _boardNotificationService.BroadcastJoinRequestCreated(boardId, requestDto);

            return requestDto!;
        }

        public async Task<IEnumerable<BoardJoinRequestDto>> GetBoardJoinRequestsAsync(string boardId, string userId,
            string? status = null)
        {
            var normalizedStatus = (status ?? "all").ToLowerInvariant();

            var board = await _context.Boards
                .Include(b => b.Members)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null)
                throw new ArgumentException("Board not found");

            var canView = board.OwnerId == userId ||
                          board.Members.Any(m => m.UserId == userId &&
                                                 (string.Equals(m.Role, "admin", StringComparison.OrdinalIgnoreCase) ||
                                                  string.Equals(m.Role, "owner", StringComparison.OrdinalIgnoreCase)));

            if (!canView)
                throw new UnauthorizedAccessException("You don't have permission to view join requests");

            var query = _context.BoardJoinRequests
                .AsNoTracking()
                .Include(r => r.User)
                .Include(r => r.Responder)
                .Where(r => r.BoardId == boardId);

            if (!string.IsNullOrEmpty(status) && normalizedStatus != "all")
            {
                query = query.Where(r => r.Status.ToLower() == normalizedStatus);
            }

            var requests = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
            var result = _mapper.Map<IEnumerable<BoardJoinRequestDto>>(requests);

            return result;
        }

        public async Task<IEnumerable<BoardJoinRequestDto>> GetUserJoinRequestsAsync(string userId,
            string? status = null)
        {
            var normalizedStatus = (status ?? "all").ToLowerInvariant();

            var query = _context.BoardJoinRequests
                .AsNoTracking()
                .Include(r => r.Board)
                .Include(r => r.Responder)
                .Where(r => r.UserId == userId);

            if (!string.IsNullOrEmpty(status) && normalizedStatus != "all")
            {
                query = query.Where(r => r.Status.ToLower() == normalizedStatus);
            }

            var requests = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
            var result = _mapper.Map<IEnumerable<BoardJoinRequestDto>>(requests);

            return result;
        }

        public async Task<JoinRequestResponseDto> RespondToJoinRequestAsync(string requestId,
            RespondToJoinRequestDto dto, string responderId)
        {
            var request = await _context.BoardJoinRequests
                .Include(r => r.Board)
                .ThenInclude(b => b.Members)
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == requestId);

            if (request == null)
                return new JoinRequestResponseDto { Success = false, Message = "Join request not found" };

            var canRespond = request.Board.OwnerId == responderId ||
                             request.Board.Members.Any(m =>
                                 m.UserId == responderId &&
                                 (string.Equals(m.Role, "admin", StringComparison.OrdinalIgnoreCase) ||
                                  string.Equals(m.Role, "owner", StringComparison.OrdinalIgnoreCase)));

            if (!canRespond)
                return new JoinRequestResponseDto
                {
                    Success = false, Message = "You don't have permission to respond to this request"
                };

            if (request.Status != JoinRequestStatus.Pending)
                return new JoinRequestResponseDto
                {
                    Success = false, Message = "This request has already been responded to"
                };

            var response = dto.Response?.ToLowerInvariant();

            if (response == "approve")
            {
                var role = dto.Role ?? "member";
                if (!RoleHierarchy.IsValidBoardRole(role))
                    role = "member";

                var member = new BoardMember
                {
                    Id = Guid.NewGuid().ToString(),
                    BoardId = request.BoardId,
                    UserId = request.UserId,
                    Role = role,
                    JoinedAt = DateTime.UtcNow
                };

                _context.BoardMembers.Add(member);
                request.Status = JoinRequestStatus.Approved;
                request.RespondedAt = DateTime.UtcNow;
                request.RespondedBy = responderId;

                await _context.SaveChangesAsync();

                var responder = await _userManager.FindByIdAsync(responderId);
                await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                {
                    UserId = request.UserId,
                    Type = "join_request_approved",
                    Title = "Join request approved",
                    Message =
                        $"Your request to join \"{request.Board.Title}\" has been approved by {responder?.UserName}",
                    ActionUrl = $"/boards/{request.BoardId}",
                    BoardId = request.BoardId
                });

                await _boardNotificationService.BroadcastJoinRequestResponded(request.BoardId, requestId,
                    request.Status, request.UserId);
                return new JoinRequestResponseDto { Success = true, Message = "Join request approved successfully" };
            }
            else if (response == "reject")
            {
                request.Status = JoinRequestStatus.Rejected;
                request.RespondedAt = DateTime.UtcNow;
                request.RespondedBy = responderId;

                await _context.SaveChangesAsync();

                var responder = await _userManager.FindByIdAsync(responderId);
                await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                {
                    UserId = request.UserId,
                    Type = "join_request_rejected",
                    Title = "Join request rejected",
                    Message = $"Your request to join \"{request.Board.Title}\" has been rejected",
                    BoardId = request.BoardId
                });

                await _boardNotificationService.BroadcastJoinRequestResponded(request.BoardId, requestId,
                    request.Status, request.UserId);
                return new JoinRequestResponseDto { Success = true, Message = "Join request rejected" };
            }

            return new JoinRequestResponseDto { Success = false, Message = "Invalid response" };
        }

        public async Task<bool> CancelJoinRequestAsync(string requestId, string userId)
        {
            var request = await _context.BoardJoinRequests.FirstOrDefaultAsync(r => r.Id == requestId);

            if (request == null || request.UserId != userId)
                return false;

            if (request.Status != JoinRequestStatus.Pending)
                return false;

            _context.BoardJoinRequests.Remove(request);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<BoardJoinRequestDto?> GetJoinRequestAsync(string requestId)
        {
            var request = await _context.BoardJoinRequests
                .Include(r => r.Board)
                .Include(r => r.User)
                .Include(r => r.Responder)
                .FirstOrDefaultAsync(r => r.Id == requestId);

            return request == null ? null : _mapper.Map<BoardJoinRequestDto>(request);
        }
    }
}