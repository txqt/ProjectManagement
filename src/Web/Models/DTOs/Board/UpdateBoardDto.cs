using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Board
{
    public class UpdateBoardDto
    {
        [MaxLength(200)]
        public string? Title { get; set; }

        public string? Description { get; set; }

        public string? Type { get; set; }

        public List<string>? ColumnOrderIds { get; set; }
    }
}
