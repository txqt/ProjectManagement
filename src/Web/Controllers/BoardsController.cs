using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Authorization;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Board;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
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
        //[RequireBoardPermission(Permissions.Boards.View)]
        public async Task<ActionResult<IEnumerable<BoardDto>>> GetUserBoards()
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var boards = await _boardService.GetUserBoardsAsync(userId);
            return Ok(boards);
        }

        [HttpGet("{boardId}")]
        [RequireBoardPermission(Permissions.Boards.View)]
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
        //[RequireBoardPermission(Permissions.Boards.Create)]
        public async Task<ActionResult<BoardDto>> CreateBoard([FromBody] CreateBoardDto createBoardDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var board = await _boardService.CreateBoardAsync(createBoardDto, userId);
            return CreatedAtAction(nameof(GetBoard), new { boardId = board.Id }, board);
        }

        [HttpPut("{boardId}")]
        [RequireBoardPermission(Permissions.Boards.Edit)]
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
        [RequireBoardPermission(Permissions.Boards.Delete)]
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
        [RequireBoardPermission(Permissions.Boards.ManageMembers)]
        public async Task<ActionResult<BoardMemberDto>> AddMember(string boardId, [FromBody] AddBoardMemberDto addMemberDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var member = await _boardService.AddMemberAsync(boardId, addMemberDto, userId);
            if (member == null)
                return BadRequest("User not found or already a member");

            return Ok(member);
        }

        [HttpDelete("{boardId}/members/{memberId}")]
        [RequireBoardPermission(Permissions.Boards.ManageMembers)]
        public async Task<ActionResult> RemoveMember(string boardId, string memberId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _boardService.RemoveMemberAsync(boardId, memberId, userId);
            if (!success)
                return NotFound();

            return NoContent();
        }

        [HttpPut("{boardId}/members/{memberId}/role")]
        [RequireBoardPermission(Permissions.Boards.ManageMembers)]
        public async Task<ActionResult> UpdateMemberRole(string boardId, string memberId, [FromBody] string role)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _boardService.UpdateMemberRoleAsync(boardId, memberId, role, userId);
            if (!success)
                return NotFound();

            return NoContent();
        }
    }
}
