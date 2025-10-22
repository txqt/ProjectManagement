using ProjectManagement.Models.DTOs.Attachment;

namespace ProjectManagement.Services.Interfaces
{
    public interface IAttachmentService
    {
        Task<AttachmentDto> UploadAsync(string boardId, string cardId, IFormFile file, string userId);
        Task<IEnumerable<AttachmentDto>> GetAttachmentsAsync(string cardId);
        Task<AttachmentDto> CreateAttachmentAsync(string cardId, CreateAttachmentDto createAttachmentDto, string userId);
        Task<bool> DeleteAttachmentAsync(string attachmentId, string userId);
    }
}