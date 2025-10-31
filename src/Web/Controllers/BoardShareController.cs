using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Attributes;
using ProjectManagement.Authorization;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.BoardShare;
using ProjectManagement.Services.Interfaces;
using System.Security.Cryptography;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/boards")]
    [Authorize]
    public class BoardShareController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IBoardShareService _boardShareService;
        private readonly ApplicationDbContext _context;

        public BoardShareController(UserManager<ApplicationUser> userManager, IBoardShareService boardShareService,
            ApplicationDbContext context)
        {
            _userManager = userManager;
            _boardShareService = boardShareService;
            _context = context;
        }

        [HttpGet("{boardId}/share-token")]
        [RequirePermission(Permissions.Boards.ManageMembers)]
        public async Task<ActionResult<ShareTokenResponseDto>> GetShareToken(string boardId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var board = await _context.Boards.FindAsync(boardId);
            if (board == null) return NotFound("Board not found");
            if (!board.AllowShareInviteLink) return BadRequest("Share invite links are disabled");

            var result = await _boardShareService.GetActiveShareTokenAsync(boardId);
            if (result == null) return NotFound("No active share token found");

            return Ok(result);
        }

        [HttpPost("{boardId}/share-token")]
        [RequirePermission(Permissions.Boards.ManageMembers)]
        public async Task<ActionResult<ShareTokenResponseDto>> GenerateShareToken(string boardId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var board = await _context.Boards.FindAsync(boardId);
            if (board == null) return NotFound("Board not found");
            if (!board.AllowShareInviteLink) return BadRequest("Share invite links are disabled");

            var result = await _boardShareService.GenerateShareTokenAsync(boardId);
            return Ok(result);
        }

        [HttpPost("join")]
        public async Task<ActionResult<JoinBoardResponseDto>> JoinViaShareLink([FromBody] JoinViaTokenDto dto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var result = await _boardShareService.JoinBoardViaTokenAsync(userId, dto);
            if (!result.Success) return BadRequest(result.Message);

            return Ok(result);
        }
    }
}