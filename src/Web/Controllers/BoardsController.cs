using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Attributes;
using ProjectManagement.Authorization;
using ProjectManagement.Models.Common;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Board;
using ProjectManagement.Models.DTOs.Common;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [RateLimit(RequestsPerMinute = 30, RequestsPerHour = 100)]
    public class BoardsController : ControllerBase
    {
        private readonly IBoardService _boardService;
        private readonly UserManager<ApplicationUser> _userManager;

        public BoardsController(IBoardService boardService, UserManager<ApplicationUser> userManager)
        {
            _boardService = boardService;
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedResult<BoardDto>>> GetUserBoards(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12,
            [FromQuery] string? search = null,
            [FromQuery] string? sortBy = "lastModified",
            [FromQuery] string? sortOrder = "desc")
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var paginationParams = new PaginationParams { Page = page, PageSize = pageSize };

            var result = await _boardService.GetUserBoardsAsync(
                userId,
                paginationParams,
                search,
                sortBy,
                sortOrder);

            return Ok(result);
        }

        [HttpGet("{boardId}")]
        [RequirePermission(Permissions.Boards.View)]
        public async Task<ActionResult<BoardDto>> GetBoard(string boardId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var board = await _boardService.GetBoardAsync(boardId, userId);
            if (board == null)
                return NotFound();

            return Ok(board);
        }

        [HttpPost]
        //[RequirePermission(Permissions.Boards.Create)]
        public async Task<ActionResult<BoardDto>> CreateBoard([FromBody] CreateBoardDto createBoardDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var board = await _boardService.CreateBoardAsync(createBoardDto, userId);
            return CreatedAtAction(nameof(GetBoard), new { boardId = board.Id }, board);
        }

        [HttpPut("{boardId}")]
        [RequireNotTemplate]
        [RequirePermission(Permissions.Boards.Edit)]
        public async Task<ActionResult<BoardDto>> UpdateBoard(string boardId, [FromBody] UpdateBoardDto updateBoardDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var board = await _boardService.UpdateBoardAsync(boardId, updateBoardDto, userId);
            if (board == null)
                return NotFound();

            return Ok(board);
        }

        [HttpDelete("{boardId}")]
        [RequirePermission(Permissions.Boards.Delete)]
        public async Task<ActionResult> DeleteBoard(string boardId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _boardService.DeleteBoardAsync(boardId, userId);
            if (!success)
                return NotFound();

            return NoContent();
        }

        [HttpPost("{boardId}/members")]
        [RequireNotTemplate]
        [RequirePermission(Permissions.Boards.ManageMembers)]
        public async Task<ActionResult<BoardMemberDto>> AddMember(string boardId,
            [FromBody] AddBoardMemberDto addMemberDto)
        {
            try
            {
                var userId = _userManager.GetUserId(User);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                var member = await _boardService.AddMemberAsync(boardId, addMemberDto, userId);
                return Ok(member);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { error = ex.Message });
            }
        }

        [HttpDelete("{boardId}/members/{memberId}")]
        [RequireNotTemplate]
        [RequirePermission(Permissions.Boards.ManageMembers)]
        public async Task<ActionResult> RemoveMember(string boardId, string memberId)
        {
            try
            {
                var userId = _userManager.GetUserId(User);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                await _boardService.RemoveMemberAsync(boardId, memberId, userId);
                return NoContent();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpPut("{boardId}/members/{memberId}/role")]
        [RequireNotTemplate]
        [RequirePermission(Permissions.Boards.ManageMembers)]
        public async Task<ActionResult> UpdateMemberRole(
            string boardId,
            string memberId,
            [FromBody] UpdateMemberRoleDto updateRoleDto)
        {
            try
            {
                var userId = _userManager.GetUserId(User);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                await _boardService.UpdateMemberRoleAsync(boardId, memberId, updateRoleDto.Role, userId);

                return Ok(new { message = "Member role updated successfully", memberId, newRole = updateRoleDto.Role });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { error = ex.Message });
            }
        }

        [HttpPost("{boardId}/transfer-ownership")]
        [RequireNotTemplate]
        [RequirePermission(Permissions.Boards.Delete)] // Chỉ owner mới có permission này
        public async Task<ActionResult> TransferOwnership(
            string boardId,
            [FromBody] TransferOwnershipDto dto)
        {
            try
            {
                var userId = _userManager.GetUserId(User);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                await _boardService.TransferOwnershipAsync(boardId, dto.NewOwnerId, userId);

                return Ok(new { message = "Board ownership transferred successfully", newOwnerId = dto.NewOwnerId });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { error = ex.Message });
            }
        }

        [HttpPost("{boardId}/clone")]
        [RequirePermission(Permissions.Boards.View)]
        public async Task<ActionResult<BoardDto>> CloneBoard(string boardId, [FromBody] CloneBoardDto cloneBoardDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var clonedBoard = await _boardService.CloneBoardAsync(boardId, cloneBoardDto, userId);
                return CreatedAtAction(nameof(GetBoard), new { boardId = clonedBoard.Id }, clonedBoard);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }

        [HttpPost("{boardId}/make-template")]
        [RequirePermission(Permissions.Boards.Edit)]
        public async Task<ActionResult<BoardDto>> MakeTemplate(string boardId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var template = await _boardService.SetTypeAsync(boardId, BoardType.Template, userId);
                return Ok(template);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }
        
        [HttpPost("{boardId}/convert-to-board")]
        [RequirePermission(Permissions.Boards.Edit)]
        public async Task<ActionResult<BoardDto>> ConvertToBoard(string boardId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var template = await _boardService.SetTypeAsync(boardId, BoardType.Private, userId);
                return Ok(template);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }

        [HttpGet("templates")]
        public async Task<ActionResult<List<BoardDto>>> GetTemplates()
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var templates = await _boardService.GetTemplatesAsync(userId);
            return Ok(templates);
        }

        [HttpPost("templates/{templateId}/create")]
        public async Task<ActionResult<BoardDto>> CreateFromTemplate(
            string templateId,
            [FromBody] CreateBoardFromTemplateDto createDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var board = await _boardService.CreateFromTemplateAsync(templateId, createDto, userId);
                return CreatedAtAction(nameof(GetBoard), new { boardId = board.Id }, board);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }
    }
}