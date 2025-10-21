using AutoMapper;
using Infrastructure;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Attachment;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Services
{
    public class AttachmentService : IAttachmentService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IWebHostEnvironment _env;

        public AttachmentService(ApplicationDbContext context, IMapper mapper, IWebHostEnvironment env)
        {
            _context = context;
            _mapper = mapper;
            _env = env;
        }

        public async Task<AttachmentDto> UploadAsync(string boardId, string cardId, IFormFile file, string userId)
        {
            var card = await _context.Cards.Include(c => c.Board).FirstOrDefaultAsync(c => c.Id == cardId && c.BoardId == boardId);
            if (card == null) throw new ArgumentException("Card not found");

            var uploadsRoot = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", boardId, cardId);
            Directory.CreateDirectory(uploadsRoot);

            var fileName = Path.GetFileName(file.FileName);
            var unique = $"{Guid.NewGuid():N}_{fileName}";
            var filePath = Path.Combine(uploadsRoot, unique);

            using (var stream = System.IO.File.Create(filePath))
            {
                await file.CopyToAsync(stream);
            }

            var url = $"/uploads/{boardId}/{cardId}/{unique}";

            var attachment = new Attachment
            {
                Id = Guid.NewGuid().ToString(),
                CardId = cardId,
                Name = fileName,
                Url = url,
                Type = "file",
                CreatedAt = DateTime.UtcNow
            };

            _context.Attachments.Add(attachment);
            await _context.SaveChangesAsync();

            return _mapper.Map<AttachmentDto>(attachment);
        }

        public async Task DeleteAsync(string attachmentId, string userId)
        {
            var attachment = await _context.Attachments.Include(a => a.Card).FirstOrDefaultAsync(a => a.Id == attachmentId);
            if (attachment == null) throw new ArgumentException("Attachment not found");

            // Try to delete file
            try
            {
                var webRoot = _env.WebRootPath ?? "wwwroot";
                var physical = Path.Combine(webRoot, attachment.Url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                if (System.IO.File.Exists(physical)) System.IO.File.Delete(physical);
            }
            catch { /* ignore */ }

            _context.Attachments.Remove(attachment);
            await _context.SaveChangesAsync();
        }
    }
}
