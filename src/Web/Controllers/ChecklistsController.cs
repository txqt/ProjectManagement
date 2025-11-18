using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Attributes;
using ProjectManagement.Authorization;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Checklist;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/boards/{boardId}/columns/{columnId}/cards/{cardId}/[controller]")]
    [Authorize]
    public class ChecklistsController : ControllerBase
    {
        private readonly IChecklistService _checklistService;
        private readonly UserManager<ApplicationUser> _userManager;

        public ChecklistsController(
            IChecklistService checklistService,
            UserManager<ApplicationUser> userManager)
        {
            _checklistService = checklistService;
            _userManager = userManager;
        }

        [HttpPost]
        [RequireNotTemplate]
        [RequirePermission(Permissions.Cards.Edit)]
        public async Task<ActionResult<ChecklistDto>> CreateChecklist(
            string boardId,
            string columnId,
            string cardId,
            [FromBody] CreateChecklistDto createDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var checklist = await _checklistService.CreateChecklistAsync(boardId, columnId, cardId, createDto, userId);

                return Ok(checklist);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("{checklistId}")]
        [RequireNotTemplate]
        [RequirePermission(Permissions.Cards.Edit)]
        public async Task<ActionResult<ChecklistDto>> UpdateChecklist(
            string boardId,
            string columnId,
            string cardId,
            string checklistId,
            [FromBody] UpdateChecklistDto updateDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var checklist = await _checklistService.UpdateChecklistAsync(checklistId, updateDto, userId);
                if (checklist == null)
                    return NotFound();

                return Ok(checklist);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpDelete("{checklistId}")]
        [RequireNotTemplate]
        [RequirePermission(Permissions.Cards.Edit)]
        public async Task<ActionResult> DeleteChecklist(
            string boardId,
            string columnId,
            string cardId,
            string checklistId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var success = await _checklistService.DeleteChecklistAsync(checklistId, userId);
                if (!success)
                    return NotFound();

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpPost("{checklistId}/items")]
        [RequireNotTemplate]
        [RequirePermission(Permissions.Cards.Edit)]
        public async Task<ActionResult<ChecklistItemDto>> CreateChecklistItem(
            string boardId,
            string columnId,
            string cardId,
            string checklistId,
            [FromBody] CreateChecklistItemDto createDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var item = await _checklistService.CreateChecklistItemAsync(checklistId, createDto, userId);

                return Ok(item);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("{checklistId}/items/{itemId}")]
        [RequireNotTemplate]
        [RequirePermission(Permissions.Cards.Edit)]
        public async Task<ActionResult<ChecklistItemDto>> UpdateChecklistItem(
            string boardId,
            string columnId,
            string cardId,
            string checklistId,
            string itemId,
            [FromBody] UpdateChecklistItemDto updateDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var item = await _checklistService.UpdateChecklistItemAsync(itemId, updateDto, userId);
                if (item == null)
                    return NotFound();

                return Ok(item);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpPost("{checklistId}/items/{itemId}/toggle")]
        [RequireNotTemplate]
        [RequirePermission(Permissions.Cards.Edit)]
        public async Task<ActionResult> ToggleChecklistItem(
            string boardId,
            string columnId,
            string cardId,
            string checklistId,
            string itemId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var success = await _checklistService.ToggleChecklistItemAsync(itemId, userId);
                if (!success)
                    return NotFound();

                return Ok();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpDelete("{checklistId}/items/{itemId}")]
        [RequireNotTemplate]
        [RequirePermission(Permissions.Cards.Edit)]
        public async Task<ActionResult> DeleteChecklistItem(
            string boardId,
            string columnId,
            string cardId,
            string checklistId,
            string itemId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var success = await _checklistService.DeleteChecklistItemAsync(itemId, userId);
                if (!success)
                    return NotFound();

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }
    }
}