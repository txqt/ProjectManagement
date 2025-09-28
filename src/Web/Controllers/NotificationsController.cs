using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Notification;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly UserManager<ApplicationUser> _userManager;

        public NotificationsController(
            INotificationService notificationService,
            UserManager<ApplicationUser> userManager)
        {
            _notificationService = notificationService;
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<NotificationDto>>> GetNotifications(
            [FromQuery] int skip = 0,
            [FromQuery] int take = 20,
            [FromQuery] bool? unreadOnly = null)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var notifications = await _notificationService.GetUserNotificationsAsync(userId, skip, take, unreadOnly);
            return Ok(notifications);
        }

        [HttpGet("summary")]
        public async Task<ActionResult<NotificationSummaryDto>> GetNotificationSummary()
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var summary = await _notificationService.GetNotificationSummaryAsync(userId);
            return Ok(summary);
        }

        [HttpPost("{notificationId}/read")]
        public async Task<ActionResult> MarkAsRead(string notificationId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _notificationService.MarkAsReadAsync(notificationId, userId);
            if (!success)
                return NotFound("Notification not found or already read");

            return NoContent();
        }

        [HttpPost("mark-all-read")]
        public async Task<ActionResult> MarkAllAsRead()
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            await _notificationService.MarkAllAsReadAsync(userId);
            return NoContent();
        }

        [HttpDelete("{notificationId}")]
        public async Task<ActionResult> DeleteNotification(string notificationId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _notificationService.DeleteNotificationAsync(notificationId, userId);
            if (!success)
                return NotFound("Notification not found");

            return NoContent();
        }

        [HttpPost("bulk-action")]
        public async Task<ActionResult<object>> BulkAction([FromBody] BulkNotificationActionDto actionDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var affectedCount = await _notificationService.BulkActionAsync(actionDto, userId);
                return Ok(new { affectedCount, message = $"{affectedCount} notifications processed" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        public async Task<ActionResult<NotificationDto>> CreateNotification([FromBody] CreateNotificationDto createNotificationDto)
        {
            // This endpoint could be used by system/admin to create notifications
            // Add appropriate authorization checks based on your requirements

            var notification = await _notificationService.CreateNotificationAsync(createNotificationDto);
            return CreatedAtAction(nameof(GetNotifications), new { }, notification);
        }
    }
}
