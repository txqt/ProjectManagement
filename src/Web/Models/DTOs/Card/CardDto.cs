using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Attachment;
using ProjectManagement.Models.DTOs.Board;
using ProjectManagement.Models.DTOs.Column;
using ProjectManagement.Models.DTOs.Comment;

namespace ProjectManagement.Models.DTOs.Card
{
    public class CardDto
    {
        public string Id { get; set; } = string.Empty;
        public string BoardId { get; set; } = string.Empty;
        public string ColumnId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Cover { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdateAt { get; set; }

        public virtual ICollection<CardMemberDto> Members { get; set; } = new List<CardMemberDto>();
        public virtual ICollection<CommentDto> Comments { get; set; } = new List<CommentDto>();
        public virtual ICollection<AttachmentDto> Attachments { get; set; } = new List<AttachmentDto>();
    }
}