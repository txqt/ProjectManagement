using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Attributes;
using ProjectManagement.Authorization;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Column;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/boards/{boardId}/[controller]")]
    [Authorize]
    public class ColumnsController : ControllerBase
    {
        private readonly IColumnService _columnService;
        private readonly UserManager<ApplicationUser> _userManager;

        public ColumnsController(IColumnService columnService, UserManager<ApplicationUser> userManager)
        {
            _columnService = columnService;
            _userManager = userManager;
        }

        [HttpGet("{columnId}")]
        [RequirePermission(Permissions.Columns.View)]
        public async Task<ActionResult<ColumnDto>> GetColumn(string columnId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var column = await _columnService.GetColumnAsync(columnId, userId);
            if (column == null)
                return NotFound();

            return Ok(column);
        }

        [HttpPost]
        [RequirePermission(Permissions.Columns.Create)]
        public async Task<ActionResult<ColumnDto>> CreateColumn(string boardId,
            [FromBody] CreateColumnDto createColumnDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var column = await _columnService.CreateColumnAsync(boardId, createColumnDto, userId);
            if (column == null)
                return NotFound();

            return CreatedAtAction(nameof(GetColumn), new { boardId, columnId = column.Id }, column);
        }

        [HttpPut("{columnId}")]
        [RequirePermission(Permissions.Columns.Edit)]
        public async Task<ActionResult<ColumnDto>> UpdateColumn(string columnId,
            [FromBody] UpdateColumnDto updateColumnDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var column = await _columnService.UpdateColumnAsync(columnId, updateColumnDto, userId);
            if (column == null)
                return NotFound();
            return Ok(column);
        }

        [HttpDelete("{columnId}")]
        [RequirePermission(Permissions.Columns.Delete)]
        public async Task<ActionResult> DeleteColumn(string columnId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _columnService.DeleteColumnAsync(columnId, userId);
            if (result == null)
                return NotFound();

            return NoContent();
        }

        [HttpPut("reorder")]
        [RequirePermission(Permissions.Columns.Reorder)]
        public async Task<ActionResult> ReorderColumns(string boardId, [FromBody] List<string> columnOrderIds)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _columnService.ReorderColumnsAsync(boardId, columnOrderIds, userId);
            if (!success)
                return BadRequest();

            return NoContent();
        }

        [HttpPost("{columnId}/clone")]
        [RequirePermission(Permissions.Columns.Create)]
        public async Task<ActionResult<ColumnDto>> CloneColumn(
            string boardId,
            string columnId,
            [FromBody] CloneColumnDto cloneDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var clonedColumn = await _columnService.CloneColumnAsync(boardId, columnId, cloneDto, userId);
                return CreatedAtAction(nameof(GetColumn), new { boardId, columnId = clonedColumn.Id }, clonedColumn);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }
    }
}