using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Authorization;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.BoardInvite;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/boards/{boardId}/invites")]
    [Authorize]
    public class BoardInvitesController : ControllerBase
    {
        private readonly IBoardInviteService _inviteService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly INotificationService _notificationService;

        public BoardInvitesController(IBoardInviteService inviteService, UserManager<ApplicationUser> userManager,
            INotificationService notificationService)
        {
            _inviteService = inviteService;
            _userManager = userManager;
            _notificationService = notificationService;
        }

        [HttpPost]
        [RequireBoardPermission(Permissions.Boards.ManageMembers)]
        public async Task<ActionResult<BoardInviteDto>> CreateInvite(
            string boardId,
            [FromBody] CreateBoardInviteDto createInviteDto)
        {
            try
            {
                var userId = _userManager.GetUserId(User);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                var invite = await _inviteService.CreateInviteAsync(boardId, createInviteDto, userId);
                if (invite == null)
                    return BadRequest("Failed to create invite");

                await _notificationService.CreateBoardInviteNotificationAsync(invite.InviteeId,
                    User?.Identity?.Name ?? "", invite.Board.Title, invite.Id);
                return Ok(invite);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpGet]
        [RequireBoardPermission(Permissions.Boards.ManageMembers)]
        public async Task<ActionResult<IEnumerable<BoardInviteDto>>> GetBoardInvites(string boardId,
            [FromQuery] string? status = "pending")
        {
            try
            {
                var userId = _userManager.GetUserId(User);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                var invites = await _inviteService.GetBoardInvitesAsync(boardId, userId, status);
                return Ok(invites);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpPost("{inviteId}/resend")]
        [RequireBoardPermission(Permissions.Boards.ManageMembers)]
        public async Task<ActionResult> ResendInvite(string boardId, string inviteId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _inviteService.ResendInviteAsync(inviteId, userId);
            if (!success)
                return NotFound("Invite not found or cannot be resent");

            return Ok(new { message = "Invite resent successfully" });
        }

        [HttpDelete("{inviteId}")]
        [RequireBoardPermission(Permissions.Boards.ManageMembers)]
        public async Task<ActionResult> CancelInvite(string boardId, string inviteId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _inviteService.CancelInviteAsync(inviteId, userId);
            if (!success)
                return NotFound("Invite not found or cannot be cancelled");

            return NoContent();
        }
    }
}