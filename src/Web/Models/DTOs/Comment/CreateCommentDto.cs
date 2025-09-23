using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Comment
{
    public class CreateCommentDto
    {
        [Required]
        public string Content { get; set; } = string.Empty;
    }
}
