using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Attributes;
using ProjectManagement.Authorization;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Label;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/boards/{boardId}/[controller]")]
    [Authorize]
    public class LabelsController : ControllerBase
    {
        private readonly ILabelService _labelService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IBoardNotificationService _notificationService;

        public LabelsController(
            ILabelService labelService,
            UserManager<ApplicationUser> userManager,
            IBoardNotificationService notificationService)
        {
            _labelService = labelService;
            _userManager = userManager;
            _notificationService = notificationService;
        }

        [HttpGet]
        [RequirePermission(Permissions.Boards.View)]
        public async Task<ActionResult<List<LabelDto>>> GetBoardLabels(string boardId)
        {
            var labels = await _labelService.GetBoardLabelsAsync(boardId);
            return Ok(labels);
        }

        [HttpPost]
        [RequirePermission(Permissions.Boards.Edit)]
        public async Task<ActionResult<LabelDto>> CreateLabel(string boardId, [FromBody] CreateLabelDto createDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var label = await _labelService.CreateLabelAsync(boardId, createDto, userId);
                
                // Broadcast via SignalR
                await _notificationService.BroadcastLabelCreated(boardId, label, userId);
                
                return CreatedAtAction(nameof(GetBoardLabels), new { boardId }, label);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpPut("{labelId}")]
        [RequirePermission(Permissions.Boards.Edit)]
        public async Task<ActionResult<LabelDto>> UpdateLabel(
            string boardId,
            string labelId,
            [FromBody] UpdateLabelDto updateDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var label = await _labelService.UpdateLabelAsync(labelId, updateDto, userId);
                if (label == null)
                    return NotFound();

                // Broadcast via SignalR
                await _notificationService.BroadcastLabelUpdated(boardId, label, userId);

                return Ok(label);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpDelete("{labelId}")]
        [RequirePermission(Permissions.Boards.Edit)]
        public async Task<ActionResult> DeleteLabel(string boardId, string labelId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var success = await _labelService.DeleteLabelAsync(labelId, userId);
                if (!success)
                    return NotFound();

                // Broadcast via SignalR
                await _notificationService.BroadcastLabelDeleted(boardId, labelId, userId);

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpPost("cards/{cardId}/labels/{labelId}")]
        [RequirePermission(Permissions.Cards.Edit)]
        public async Task<ActionResult> AddLabelToCard(
            string boardId,
            string cardId,
            string labelId,
            [FromQuery] string columnId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var success = await _labelService.AddLabelToCardAsync(boardId, columnId, cardId, labelId, userId);
                if (!success)
                    return NotFound();

                // Broadcast via SignalR
                await _notificationService.BroadcastCardLabelAdded(boardId, columnId, cardId, labelId, userId);

                return Ok();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpDelete("cards/{cardId}/labels/{labelId}")]
        [RequirePermission(Permissions.Cards.Edit)]
        public async Task<ActionResult> RemoveLabelFromCard(
            string boardId,
            string cardId,
            string labelId,
            [FromQuery] string columnId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var success = await _labelService.RemoveLabelFromCardAsync(boardId, columnId, cardId, labelId, userId);
                if (!success)
                    return NotFound();

                // Broadcast via SignalR
                await _notificationService.BroadcastCardLabelRemoved(boardId, columnId, cardId, labelId, userId);

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }
    }
}