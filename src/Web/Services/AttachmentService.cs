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
        private readonly IBoardNotificationService _boardNotificationService;

        public AttachmentService(ApplicationDbContext context, IMapper mapper, IWebHostEnvironment env,
            IBoardNotificationService boardNotificationService)
        {
            _context = context;
            _mapper = mapper;
            _env = env;
            _boardNotificationService = boardNotificationService;
        }

        public async Task<AttachmentDto> UploadAsync(string boardId, string cardId, IFormFile file, string userId)
        {
            var card = await _context.Cards.Include(c => c.Board)
                .FirstOrDefaultAsync(c => c.Id == cardId && c.BoardId == boardId);
            if (card == null) throw new ArgumentException("Card not found");

            if (card.Board?.AllowAttachmentsOnCard == false)
            {
                throw new ArgumentException("Attachments are not allowed on this card");
            }

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

        public async Task<IEnumerable<AttachmentDto>> GetAttachmentsAsync(string cardId)
        {
            var attachments = await _context.Attachments
                .Where(a => a.CardId == cardId)
                .OrderBy(a => a.CreatedAt)
                .ToListAsync();

            return _mapper.Map<IEnumerable<AttachmentDto>>(attachments);
        }

        public async Task<AttachmentDto> CreateAttachmentAsync(string cardId, CreateAttachmentDto createAttachmentDto,
            string userId)
        {
            var card = await _context.Cards
                .Include(c => c.Board)
                .FirstOrDefaultAsync(c => c.Id == cardId);

            if (card == null)
                throw new ArgumentException("Card not found");

            if (card.Board?.AllowAttachmentsOnCard == false)
            {
                throw new ArgumentException("Card is not allow attachments");
            }

            var attachment = new Attachment
            {
                Id = Guid.NewGuid().ToString(),
                CardId = cardId,
                Name = createAttachmentDto.Name,
                Url = createAttachmentDto.Url,
                Type = createAttachmentDto.Type ?? "file",
                CreatedAt = DateTime.UtcNow,
                LastModified = DateTime.UtcNow
            };

            _context.Attachments.Add(attachment);
            await _context.SaveChangesAsync();

            var attachmentDto = _mapper.Map<AttachmentDto>(attachment);

            await _boardNotificationService.BroadcastAttachmentAdded(
                card.BoardId,
                card.ColumnId,
                cardId,
                attachmentDto,
                userId
            );

            return attachmentDto;
        }

        public async Task<bool> DeleteAttachmentAsync(string attachmentId, string userId)
        {
            var attachment = await _context.Attachments
                .Include(a => a.Card)
                .FirstOrDefaultAsync(a => a.Id == attachmentId);

            if (attachment == null)
                return false;

            var boardId = attachment.Card.BoardId;
            var columnId = attachment.Card.ColumnId;
            var cardId = attachment.CardId;

            _context.Attachments.Remove(attachment);
            await _context.SaveChangesAsync();

            await _boardNotificationService.BroadcastAttachmentDeleted(
                boardId,
                columnId,
                cardId,
                attachmentId,
                userId
            );

            return true;
        }
    }
}