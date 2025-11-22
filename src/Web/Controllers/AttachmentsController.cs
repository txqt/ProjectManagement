using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Services.Interfaces;
using ProjectManagement.Models.DTOs.Attachment;
using Microsoft.AspNetCore.Identity;
using ProjectManagement.Attributes;
using ProjectManagement.Authorization;
using ProjectManagement.Models.Domain.Entities;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/boards/{boardId}/columns/{columnId}/cards/{cardId}/[controller]")]
    [Authorize]
    [RequirePermission(ProjectManagement.Authorization.Permissions.Cards.Attach)]
    public class AttachmentsController : ControllerBase
    {
        private readonly IAttachmentService _attachmentService;
        private readonly UserManager<ApplicationUser> _userManager;

        public AttachmentsController(IAttachmentService attachmentService, UserManager<ApplicationUser> userManager)
        {
            _attachmentService = attachmentService;
            _userManager = userManager;
        }

        [HttpPost("upload")]
        [RequireNotTemplate]
        public async Task<ActionResult<AttachmentDto>> Upload(string boardId, string columnId, string cardId, IFormFile file)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var dto = await _attachmentService.UploadAsync(boardId, cardId, file, userId);
            return Ok(dto);
        }
        
        [HttpGet]
        [RequirePermission(Permissions.Cards.View)]
        public async Task<ActionResult<IEnumerable<AttachmentDto>>> GetAttachments(string cardId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var attachments = await _attachmentService.GetAttachmentsAsync(cardId);
            return Ok(attachments);
        }

        [HttpPost]
        [RequireNotTemplate]
        [RequirePermission(Permissions.Cards.Attach)]
        public async Task<ActionResult<AttachmentDto>> CreateAttachment(string cardId,
            [FromBody] CreateAttachmentDto createAttachmentDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var attachment = await _attachmentService.CreateAttachmentAsync(cardId, createAttachmentDto, userId);
            return Ok(attachment);
        }

        [HttpDelete("{attachmentId}")]
        [RequireNotTemplate]
        [RequirePermission(Permissions.Cards.Attach)]
        public async Task<ActionResult> DeleteAttachment(string attachmentId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _attachmentService.DeleteAttachmentAsync(attachmentId, userId);
            if (!success)
                return NotFound();

            return NoContent();
        }
    }
}