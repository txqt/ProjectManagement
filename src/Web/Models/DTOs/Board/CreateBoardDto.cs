using ProjectManagement.Models.Common;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Board
{
    public class CreateBoardDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }
        
        public string? Cover { get; set; }

        public string Type { get; set; } = BoardType.Public;
    }
}
