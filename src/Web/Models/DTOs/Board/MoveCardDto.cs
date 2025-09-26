using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Board
{
    public class MoveCardDto
    {
        [Required]
        public string FromColumnId { get; set; } = string.Empty;

        [Required]
        public string ToColumnId { get; set; } = string.Empty;

        public int NewIndex { get; set; }
    }
}
