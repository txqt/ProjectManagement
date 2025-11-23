using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.BoardJoinRequest;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/boards/{boardId}/join-requests")]
    [Authorize]
    public class BoardJoinRequestsController : ControllerBase
    {
        private readonly IBoardJoinRequestService _joinRequestService;
        private readonly UserManager<ApplicationUser> _userManager;

        public BoardJoinRequestsController(
            IBoardJoinRequestService joinRequestService,
            UserManager<ApplicationUser> userManager)
        {
            _joinRequestService = joinRequestService;
            _userManager = userManager;
        }

        /// <summary>
        /// Request to join a board (for users with share link)
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<BoardJoinRequestDto>> CreateJoinRequest(
            string boardId,
            [FromBody] CreateBoardJoinRequestDto dto)
        {
            try
            {
                var userId = _userManager.GetUserId(User);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                var request = await _joinRequestService.CreateJoinRequestAsync(boardId, dto, userId);
                return Ok(request);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }

        /// <summary>
        /// Get all join requests for a board (owner/admin only)
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<BoardJoinRequestDto>>> GetBoardJoinRequests(
            string boardId,
            [FromQuery] string? status = "pending")
        {
            try
            {
                var userId = _userManager.GetUserId(User);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                var requests = await _joinRequestService.GetBoardJoinRequestsAsync(boardId, userId, status);
                return Ok(requests);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ex.Message);
            }
        }

        /// <summary>
        /// Respond to a join request (approve or reject)
        /// </summary>
        [HttpPost("{requestId}/respond")]
        public async Task<ActionResult<JoinRequestResponseDto>> RespondToJoinRequest(
            string boardId,
            string requestId,
            [FromBody] RespondToJoinRequestDto dto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _joinRequestService.RespondToJoinRequestAsync(requestId, dto, userId);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        /// <summary>
        /// Cancel a join request (requester only)
        /// </summary>
        [HttpDelete("{requestId}")]
        public async Task<ActionResult> CancelJoinRequest(string boardId, string requestId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _joinRequestService.CancelJoinRequestAsync(requestId, userId);
            if (!success)
                return NotFound("Join request not found or cannot be cancelled");

            return NoContent();
        }
    }
}