using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Infrastructure;
using ProjectManagement.Attributes;
using ProjectManagement.Authorization;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.BoardShare;
using System.Security.Cryptography;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/boards")]
    [Authorize]
    public class BoardShareController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;

        public BoardShareController(ApplicationDbContext context, UserManager<ApplicationUser> userManager, IConfiguration configuration)
        {
            _context = context;
            _userManager = userManager;
            _configuration = configuration;
        }
        
        [HttpGet("{boardId}/share-token")]
        [RequirePermission(Permissions.Boards.ManageMembers)]
        public async Task<ActionResult<ShareTokenResponseDto>> GetShareToken(string boardId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var board = await _context.Boards.FindAsync(boardId);
            if (board == null)
                return NotFound("Board not found");

            if (!board.AllowShareInviteLink)
            {
                return BadRequest("Share invite links are disabled for this board");
            }

            var activeToken = await _context.BoardShareTokens
                .Where(t => t.BoardId == boardId && t.IsActive && t.ExpiresAt > DateTime.UtcNow)
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();

            if (activeToken == null)
                return NotFound("No active share token found");

            return Ok(new ShareTokenResponseDto
            {
                Token = activeToken.Token,
                ExpiresAt = activeToken.ExpiresAt,
                ShareUrl = $"{_configuration["ClientUrl"]}/join?token={activeToken.Token}"
            });
        }

        /// <summary>
        /// Generate or regenerate share token for board
        /// </summary>
        [HttpPost("{boardId}/share-token")]
        [RequirePermission(Permissions.Boards.ManageMembers)]
        public async Task<ActionResult<ShareTokenResponseDto>> GenerateShareToken(string boardId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var board = await _context.Boards.FindAsync(boardId);
            if (board == null)
                return NotFound("Board not found");
            
            if (!board.AllowShareInviteLink)
            {
                return BadRequest("Share invite links are disabled for this board");
            }

            // Deactivate old tokens
            var oldTokens = await _context.BoardShareTokens
                .Where(t => t.BoardId == boardId && t.IsActive)
                .ToListAsync();

            foreach (var oldToken in oldTokens)
            {
                oldToken.IsActive = false;
            }

            // Generate new secure token
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

            return Ok(new ShareTokenResponseDto
            {
                Token = token,
                ExpiresAt = shareToken.ExpiresAt,
                ShareUrl = $"http://localhost:5173/join?token={token}"
            });
        }

        /// <summary>
        /// Join board via share link token
        /// </summary>
        [HttpPost("join")]
        public async Task<ActionResult<JoinBoardResponseDto>> JoinViaShareLink([FromBody] JoinViaTokenDto dto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Validate token
            var shareToken = await _context.BoardShareTokens
                .Include(t => t.Board)
                .ThenInclude(b => b.Members)
                .FirstOrDefaultAsync(t => t.Token == dto.Token && t.IsActive);

            if (shareToken == null || shareToken.ExpiresAt < DateTime.UtcNow)
                return BadRequest("Invalid or expired token");

            var board = shareToken.Board;

            if (!board.AllowShareInviteLink)
                return BadRequest("Share invite links are disabled for this board");

            // Check if already a member
            var existingMember = board.Members.FirstOrDefault(m => m.UserId == userId);
            if (existingMember != null)
                return Ok(new JoinBoardResponseDto
                {
                    Success = true,
                    Message = "You are already a member of this board",
                    BoardId = board.Id,
                    Action = "already_member"
                });

            // PUBLIC board → auto-join
            if (board.Type == "public")
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

                return Ok(new JoinBoardResponseDto
                {
                    Success = true,
                    Message = "Successfully joined the board",
                    BoardId = board.Id,
                    Action = "auto_joined"
                });
            }

            // PRIVATE board → create join request
            var existingRequest = await _context.BoardJoinRequests
                .FirstOrDefaultAsync(r => r.BoardId == board.Id && r.UserId == userId && r.Status == JoinRequestStatus.Pending);

            if (existingRequest != null)
                return Ok(new JoinBoardResponseDto
                {
                    Success = true,
                    Message = "You already have a pending join request for this board",
                    BoardId = board.Id,
                    Action = "request_exists"
                });

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

            return Ok(new JoinBoardResponseDto
            {
                Success = true,
                Message = "Join request submitted. Waiting for approval from board admins.",
                BoardId = board.Id,
                Action = "request_created"
            });
        }
    }
}