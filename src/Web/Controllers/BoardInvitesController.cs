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

        public BoardInvitesController(IBoardInviteService inviteService, UserManager<ApplicationUser> userManager)
        {
            _inviteService = inviteService;
            _userManager = userManager;
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
        public async Task<ActionResult<IEnumerable<BoardInviteDto>>> GetBoardInvites(string boardId)
        {
            try
            {
                var userId = _userManager.GetUserId(User);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                var invites = await _inviteService.GetBoardInvitesAsync(boardId, userId);
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
