using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Comment
{
    public class UpdateCommentDto
    {
        [Required]
        public string Content { get; set; } = string.Empty;
    }
}
