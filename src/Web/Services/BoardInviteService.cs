using AutoMapper;
using Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.BoardInvite;
using ProjectManagement.Models.DTOs.Notification;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Services
{
    public class BoardInviteService : IBoardInviteService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly INotificationService _notificationService;
        private readonly ILogger<BoardInviteService> _logger;

        public BoardInviteService(
            ApplicationDbContext context,
            IMapper mapper,
            UserManager<ApplicationUser> userManager,
            INotificationService notificationService,
            ILogger<BoardInviteService> logger)
        {
            _context = context;
            _mapper = mapper;
            _userManager = userManager;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<BoardInviteDto> CreateInviteAsync(string boardId, CreateBoardInviteDto createInviteDto, string inviterId)
        {
            var board = await _context.Boards
                .Include(b => b.Members)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null)
                throw new ArgumentException("Board not found");

            // Check if user can invite (owner or admin)
            if (board.OwnerId != inviterId &&
                !board.Members.Any(m => m.UserId == inviterId && (m.Role == "admin" || m.Role == "owner")))
                throw new UnauthorizedAccessException("You don't have permission to invite members to this board");

            // Check if email is already a member
            var existingUser = await _userManager.FindByEmailAsync(createInviteDto.InviteeEmail);
            if (existingUser != null)
            {
                var isMember = board.OwnerId == existingUser.Id ||
                              board.Members.Any(m => m.UserId == existingUser.Id);
                if (isMember)
                    throw new InvalidOperationException("User is already a member of this board");
            }

            // Check if there's already a pending invite
            var existingInvite = await _context.BoardInvites
                .FirstOrDefaultAsync(i => i.BoardId == boardId &&
                                        i.InviteeEmail == createInviteDto.InviteeEmail &&
                                        i.Status == InviteStatus.Pending);

            if (existingInvite != null)
                throw new InvalidOperationException("A pending invite already exists for this email");

            var invite = new BoardInvite
            {
                Id = Guid.NewGuid().ToString(),
                BoardId = boardId,
                InviterId = inviterId,
                InviteeEmail = createInviteDto.InviteeEmail,
                InviteeId = existingUser?.Id,
                Role = createInviteDto.Role,
                Message = createInviteDto.Message,
                Created = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            _context.BoardInvites.Add(invite);
            await _context.SaveChangesAsync();

            // Create notification if user exists
            if (existingUser != null)
            {
                var inviter = await _userManager.FindByIdAsync(inviterId);
                await _notificationService.CreateBoardInviteNotificationAsync(
                    existingUser.Id,
                    inviter?.UserName ?? "Someone",
                    board.Title,
                    invite.Id);
            }

            // Load full data for response
            var createdInvite = await _context.BoardInvites
                .Include(i => i.Board)
                .Include(i => i.Inviter)
                .Include(i => i.Invitee)
                .FirstOrDefaultAsync(i => i.Id == invite.Id);

            return _mapper.Map<BoardInviteDto>(createdInvite);
        }

        public async Task<IEnumerable<BoardInviteDto>> GetBoardInvitesAsync(string boardId, string userId, string? status)
        {
            var board = await _context.Boards
                .Include(b => b.Members)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null)
                throw new ArgumentException("Board not found");
            
            var query = _context.BoardInvites
                .Include(i => i.Inviter)
                .Where(i => i.BoardId == boardId);

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(i => i.Status == status);
            }

            var invites = await query
                .OrderByDescending(i => i.Created)
                .ToListAsync();

            return _mapper.Map<IEnumerable<BoardInviteDto>>(invites);
        }

        public async Task<IEnumerable<BoardInviteDto>> GetUserInvitesAsync(string userId, string? status = null)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                throw new ArgumentException("User not found");

            var query = _context.BoardInvites
                .Include(i => i.Board)
                .Include(i => i.Inviter)
                .Include(i => i.Invitee)
                .Where(i => i.InviteeEmail == user.Email || i.InviteeId == userId);

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(i => i.Status == status);
            }

            var invites = await query
                .OrderByDescending(i => i.Created)
                .ToListAsync();

            return _mapper.Map<IEnumerable<BoardInviteDto>>(invites);
        }

        public async Task<InviteResponseDto> RespondToInviteAsync(string inviteId, RespondToInviteDto responseDto, string userId)
        {
            var invite = await _context.BoardInvites
                .Include(i => i.Board)
                .Include(i => i.Inviter)
                .FirstOrDefaultAsync(i => i.Id == inviteId);

            if (invite == null)
                return new InviteResponseDto { Success = false, Message = "Invite not found" };

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null || (invite.InviteeEmail != user.Email && invite.InviteeId != userId))
                return new InviteResponseDto { Success = false, Message = "You are not authorized to respond to this invite" };

            if (invite.Status != InviteStatus.Pending)
                return new InviteResponseDto { Success = false, Message = "This invite has already been responded to" };

            if (invite.ExpiresAt < DateTime.UtcNow)
            {
                invite.Status = InviteStatus.Expired;
                await _context.SaveChangesAsync();
                return new InviteResponseDto { Success = false, Message = "This invite has expired" };
            }

            if (responseDto.Response.ToLower() == "accept")
            {
                // Add user to board
                var existingMember = await _context.BoardMembers
                    .FirstOrDefaultAsync(bm => bm.BoardId == invite.BoardId && bm.UserId == userId);

                if (existingMember == null)
                {
                    var member = new BoardMember
                    {
                        Id = Guid.NewGuid().ToString(),
                        BoardId = invite.BoardId,
                        UserId = userId,
                        Role = invite.Role,
                        JoinedAt = DateTime.UtcNow
                    };

                    _context.BoardMembers.Add(member);
                }

                invite.Status = InviteStatus.Accepted;
                invite.RespondedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Notify inviter
                await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                {
                    UserId = invite.InviterId,
                    Type = NotificationTypes.BoardInviteAccepted,
                    Title = "Board invite accepted",
                    Message = $"{user.UserName} has accepted your invitation to join \"{invite.Board.Title}\"",
                    ActionUrl = $"/boards/{invite.BoardId}",
                    BoardId = invite.BoardId
                });

                return new InviteResponseDto { Success = true, Message = "Invite accepted successfully" };
            }
            else if (responseDto.Response.ToLower() == "decline")
            {
                invite.Status = InviteStatus.Declined;
                invite.RespondedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Notify inviter
                await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                {
                    UserId = invite.InviterId,
                    Type = NotificationTypes.BoardInviteDeclined,
                    Title = "Board invite declined",
                    Message = $"{user.UserName} has declined your invitation to join \"{invite.Board.Title}\"",
                    BoardId = invite.BoardId
                });

                return new InviteResponseDto { Success = true, Message = "Invite declined" };
            }

            return new InviteResponseDto { Success = false, Message = "Invalid response" };
        }

        public async Task<bool> CancelInviteAsync(string inviteId, string userId)
        {
            var invite = await _context.BoardInvites
                .Include(i => i.Board)
                .FirstOrDefaultAsync(i => i.Id == inviteId);

            if (invite == null)
                return false;

            // Only inviter or board owner/admin can cancel
            if (invite.InviterId != userId && invite.Board.OwnerId != userId)
            {
                var membership = await _context.BoardMembers
                    .FirstOrDefaultAsync(bm => bm.BoardId == invite.BoardId && bm.UserId == userId);

                if (membership == null || (membership.Role != "admin" && membership.Role != "owner"))
                    return false;
            }

            if (invite.Status != InviteStatus.Pending)
                return false;

            invite.Status = InviteStatus.Cancelled;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<BoardInviteDto?> GetInviteAsync(string inviteId)
        {
            var invite = await _context.BoardInvites
                .Include(i => i.Board)
                .Include(i => i.Inviter)
                .Include(i => i.Invitee)
                .FirstOrDefaultAsync(i => i.Id == inviteId);

            return invite == null ? null : _mapper.Map<BoardInviteDto>(invite);
        }

        public async Task<bool> ResendInviteAsync(string inviteId, string userId)
        {
            var invite = await _context.BoardInvites
                .Include(i => i.Board)
                .FirstOrDefaultAsync(i => i.Id == inviteId);

            if (invite == null || invite.Status != InviteStatus.Pending)
                return false;

            // Only inviter or board owner/admin can resend
            if (invite.InviterId != userId && invite.Board.OwnerId != userId)
            {
                var membership = await _context.BoardMembers
                    .FirstOrDefaultAsync(bm => bm.BoardId == invite.BoardId && bm.UserId == userId);

                if (membership == null || (membership.Role != "admin" && membership.Role != "owner"))
                    return false;
            }

            // Extend expiry date
            invite.ExpiresAt = DateTime.UtcNow.AddDays(7);
            await _context.SaveChangesAsync();

            // Create new notification if user exists
            if (!string.IsNullOrEmpty(invite.InviteeId))
            {
                var inviter = await _userManager.FindByIdAsync(userId);
                await _notificationService.CreateBoardInviteNotificationAsync(
                    invite.InviteeId,
                    inviter?.UserName ?? "Someone",
                    invite.Board.Title,
                    invite.Id);
            }

            return true;
        }

        public async Task CleanupExpiredInvitesAsync()
        {
            var expiredInvites = await _context.BoardInvites
                .Where(i => i.Status == InviteStatus.Pending && i.ExpiresAt < DateTime.UtcNow)
                .ToListAsync();

            foreach (var invite in expiredInvites)
            {
                invite.Status = InviteStatus.Expired;
            }

            if (expiredInvites.Any())
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Marked {Count} invites as expired", expiredInvites.Count);
            }
        }
    }
}
