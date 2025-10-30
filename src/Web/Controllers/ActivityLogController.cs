using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Authorization;
using ProjectManagement.Models.DTOs.Activity;
using ProjectManagement.Services.Interfaces;
using System.Security.Claims;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/boards/{boardId}/activities")]
    [Authorize]
    public class ActivityLogController : ControllerBase
    {
        private readonly IActivityLogService _activityLogService;
        private readonly IPermissionService _permissionService;

        public ActivityLogController(
            IActivityLogService activityLogService,
            IPermissionService permissionService)
        {
            _activityLogService = activityLogService;
            _permissionService = permissionService;
        }

        private string GetUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                   ?? User.FindFirst("sub")?.Value
                   ?? throw new UnauthorizedAccessException("User ID not found");
        }

        /// <summary>
        /// Get all activities for a board with filtering
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<ActivityLogDto>>> GetBoardActivities(
            string boardId,
            [FromQuery] ActivityFilterDto filter)
        {
            var userId = GetUserId();
            var (hasPermission, _) = await _permissionService.CheckBoardPermissionAsync(
                userId, boardId, Permissions.Boards.View);

            if (!hasPermission)
            {
                return Forbid();
            }

            var activities = await _activityLogService.GetBoardActivitiesAsync(boardId, filter);
            return Ok(activities);
        }

        /// <summary>
        /// Get activities for a specific card
        /// </summary>
        [HttpGet("cards/{cardId}")]
        public async Task<ActionResult<List<ActivityLogDto>>> GetCardActivities(
            string boardId,
            string cardId,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 50)
        {
            var userId = GetUserId();
            var (hasPermission, _) = await _permissionService.CheckBoardPermissionAsync(
                userId, boardId, Permissions.Boards.View);

            if (!hasPermission)
            {
                return Forbid();
            }

            var activities = await _activityLogService.GetCardActivitiesAsync(boardId, cardId, skip, take);
            return Ok(activities);
        }

        /// <summary>
        /// Get activity summary for a board
        /// </summary>
        [HttpGet("summary")]
        public async Task<ActionResult<ActivitySummaryDto>> GetActivitySummary(
            string boardId,
            [FromQuery] int days = 7)
        {
            var userId = GetUserId();
            var (hasPermission, _) = await _permissionService.CheckBoardPermissionAsync(
                userId, boardId, Permissions.Boards.View);

            if (!hasPermission)
            {
                return Forbid();
            }

            var summary = await _activityLogService.GetActivitySummaryAsync(boardId, days);
            return Ok(summary);
        }

        /// <summary>
        /// Manually log an activity (for custom events)
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ActivityLogDto>> LogActivity(
            string boardId,
            [FromBody] CreateActivityLogDto dto)
        {
            var userId = GetUserId();
            var (hasPermission, _) = await _permissionService.CheckBoardPermissionAsync(
                userId, boardId, Permissions.Boards.Edit);

            if (!hasPermission)
            {
                return Forbid();
            }

            dto.BoardId = boardId;
            var activity = await _activityLogService.LogActivityAsync(userId, dto);
            return Ok(activity);
        }
    }
}