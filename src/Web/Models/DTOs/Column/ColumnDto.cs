using ProjectManagement.Models.DTOs.Board;
using ProjectManagement.Models.DTOs.Card;

namespace ProjectManagement.Models.DTOs.Column
{
    public class ColumnDto
    {
        public string Id { get; set; } = string.Empty;
        public string BoardId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public List<string> CardOrderIds { get; set; } = new List<string>();
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public List<CardDto> Cards { get; set; } = new List<CardDto>();
    }
}
