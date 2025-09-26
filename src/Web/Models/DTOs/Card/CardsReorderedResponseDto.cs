namespace ProjectManagement.Models.DTOs.Card
{
    public class CardsReorderedResponse
    {
        public string BoardId { get; set; } = string.Empty;
        public string ColumnId { get; set; } = string.Empty;
        public List<string> CardOrderIds { get; set; } = new();
        public string UserId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
