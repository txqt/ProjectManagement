using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Board
{
    public class MoveCardDto
    {
        [Required]
        public string DestinationColumnId { get; set; } = string.Empty;

        public int Position { get; set; }
    }
}
