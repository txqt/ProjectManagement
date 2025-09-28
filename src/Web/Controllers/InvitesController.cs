using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.BoardInvite;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/invites")]
    [Authorize]
    public class InvitesController : ControllerBase
    {
        private readonly IBoardInviteService _inviteService;
        private readonly UserManager<ApplicationUser> _userManager;

        public InvitesController(IBoardInviteService inviteService, UserManager<ApplicationUser> userManager)
        {
            _inviteService = inviteService;
            _userManager = userManager;
        }

        [HttpGet("my-invites")]
        public async Task<ActionResult<IEnumerable<BoardInviteDto>>> GetMyInvites([FromQuery] string? status = null)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var invites = await _inviteService.GetUserInvitesAsync(userId, status);
            return Ok(invites);
        }

        [HttpGet("{inviteId}")]
        public async Task<ActionResult<BoardInviteDto>> GetInvite(string inviteId)
        {
            var invite = await _inviteService.GetInviteAsync(inviteId);
            if (invite == null)
                return NotFound();

            var userId = _userManager.GetUserId(User);
            var user = await _userManager.FindByIdAsync(userId ?? "");

            // Only invitee can view the invite details
            if (user == null || (invite.InviteeEmail != user.Email && invite.InviteeId != userId))
                return Forbid();

            return Ok(invite);
        }

        [HttpPost("{inviteId}/respond")]
        public async Task<ActionResult<InviteResponseDto>> RespondToInvite(
            string inviteId,
            [FromBody] RespondToInviteDto responseDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _inviteService.RespondToInviteAsync(inviteId, responseDto, userId);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }
    }
}
