using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Board
{
    public class CreateBoardDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string Type { get; set; } = "public";
    }
}
