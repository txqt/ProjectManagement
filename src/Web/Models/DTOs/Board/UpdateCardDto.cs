using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Board
{
    public class UpdateCardDto
    {
        [MaxLength(200)]
        public string? Title { get; set; }

        public string? Description { get; set; }
        public string? Cover { get; set; }
        public string? ColumnId { get; set; }
    }
}
