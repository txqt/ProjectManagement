using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Attributes;
using ProjectManagement.Authorization;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Comment;
using ProjectManagement.Models.DTOs.Attachment;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/boards/{boardId}/columns/{columnId}/cards/{cardId}/comments")]
    [Authorize]
    public class CommentsController : ControllerBase
    {
        private readonly ICommentService _commentService;
        private readonly UserManager<ApplicationUser> _userManager;

        public CommentsController(ICommentService commentService, UserManager<ApplicationUser> userManager)
        {
            _commentService = commentService;
            _userManager = userManager;
        }

        [HttpGet]
        [RequirePermission(Permissions.Cards.View)]
        public async Task<ActionResult<IEnumerable<CommentDto>>> GetComments(string cardId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var comments = await _commentService.GetCommentsAsync(cardId);
            return Ok(comments);
        }

        [HttpPost]
        [RequireNotTemplate]
        [RequirePermission(Permissions.Cards.Comment)]
        public async Task<ActionResult<CommentDto>> CreateComment(string cardId, [FromBody] CreateCommentDto createCommentDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var comment = await _commentService.CreateCommentAsync(cardId, createCommentDto, userId);
            return Ok(comment);
        }

        [HttpPut("{commentId}")]
        [RequireNotTemplate]
        [RequirePermission(Permissions.Cards.Comment)]
        public async Task<ActionResult<CommentDto>> UpdateComment(string commentId, [FromBody] UpdateCommentDto updateCommentDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var comment = await _commentService.UpdateCommentAsync(commentId, updateCommentDto, userId);
            if (comment == null)
                return NotFound();

            return Ok(comment);
        }

        [HttpDelete("{commentId}")]
        [RequireNotTemplate]
        [RequirePermission(Permissions.Cards.Comment)]
        public async Task<ActionResult> DeleteComment(string commentId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _commentService.DeleteCommentAsync(commentId, userId);
            if (!success)
                return NotFound();

            return NoContent();
        }
    }
}