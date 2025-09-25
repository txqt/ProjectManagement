using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
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
        [HasPermission(Permissions.Columns.View)]
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
        [HasPermission(Permissions.Columns.Create)]
        public async Task<ActionResult<ColumnDto>> CreateColumn(string boardId, [FromBody] CreateColumnDto createColumnDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var column = await _columnService.CreateColumnAsync(boardId, createColumnDto, userId);
            return CreatedAtAction(nameof(GetColumn), new { boardId, columnId = column.Id }, column);
        }

        [HttpPut("{columnId}")]
        [HasPermission(Permissions.Columns.Edit)]
        public async Task<ActionResult<ColumnDto>> UpdateColumn(string columnId, [FromBody] UpdateColumnDto updateColumnDto)
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
        [HasPermission(Permissions.Columns.Delete)]
        public async Task<ActionResult> DeleteColumn(string columnId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _columnService.DeleteColumnAsync(columnId, userId);
            if (!success)
                return NotFound();

            return NoContent();
        }

        [HttpPut("reorder")]
        [HasPermission(Permissions.Columns.Reorder)]
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
    }
}
