using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.BoardJoinRequest;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Controllers
{
    /// <summary>
    /// Controller for user's own join requests
    /// </summary>
    [ApiController]
    [Route("api/join-requests")]
    [Authorize]
    public class JoinRequestsController : ControllerBase
    {
        private readonly IBoardJoinRequestService _joinRequestService;
        private readonly UserManager<ApplicationUser> _userManager;

        public JoinRequestsController(
            IBoardJoinRequestService joinRequestService,
            UserManager<ApplicationUser> userManager)
        {
            _joinRequestService = joinRequestService;
            _userManager = userManager;
        }

        /// <summary>
        /// Get current user's join requests
        /// </summary>
        [HttpGet("my-requests")]
        public async Task<ActionResult<IEnumerable<BoardJoinRequestDto>>> GetMyJoinRequests(
            [FromQuery] string? status = null)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var requests = await _joinRequestService.GetUserJoinRequestsAsync(userId, status);
            return Ok(requests);
        }

        /// <summary>
        /// Get a specific join request
        /// </summary>
        [HttpGet("{requestId}")]
        public async Task<ActionResult<BoardJoinRequestDto>> GetJoinRequest(string requestId)
        {
            var request = await _joinRequestService.GetJoinRequestAsync(requestId);
            if (request == null)
                return NotFound();

            var userId = _userManager.GetUserId(User);
            
            // Only requester or board admins can view
            if (request.UserId != userId)
                return Forbid();

            return Ok(request);
        }
    }
}