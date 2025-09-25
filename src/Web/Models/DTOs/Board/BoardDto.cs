using ProjectManagement.Models.DTOs.Attachment;
using ProjectManagement.Models.DTOs.Column;
using ProjectManagement.Models.DTOs.Comment;

namespace ProjectManagement.Models.DTOs.Board
{
    public class BoardDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Type { get; set; } = string.Empty;
        public string OwnerId { get; set; } = string.Empty;
        public List<string> ColumnOrderIds { get; set; } = new List<string>();
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public List<ColumnDto> Columns { get; set; } = new List<ColumnDto>();
        public List<UserDto> Members { get; set; } = new List<UserDto>();
        public List<CommentDto> Comments { get; set; } = new List<CommentDto>();
        public List<AttachmentDto> Attachments { get; set; } = new List<AttachmentDto>();
    }
}
