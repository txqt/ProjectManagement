using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Attributes;
using ProjectManagement.Authorization;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Board;
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
        //[RequirePermission(Permissions.Boards.View)]
        public async Task<ActionResult<IEnumerable<BoardDto>>> GetUserBoards()
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var boards = await _boardService.GetUserBoardsAsync(userId);
            return Ok(boards);
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
        [RequirePermission(Permissions.Boards.ManageMembers)]
        public async Task<ActionResult<BoardMemberDto>> AddMember(string boardId, [FromBody] AddBoardMemberDto addMemberDto)
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
        
                return Ok(new 
                { 
                    message = "Member role updated successfully",
                    memberId,
                    newRole = updateRoleDto.Role 
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { error = ex.Message });
            }
        }
        
        [HttpPost("{boardId}/transfer-ownership")]
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
        
                return Ok(new 
                { 
                    message = "Board ownership transferred successfully",
                    newOwnerId = dto.NewOwnerId 
                });
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
    }
}
