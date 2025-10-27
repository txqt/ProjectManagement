namespace ProjectManagement.Models.DTOs.Search
{
    public class SearchCardDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Cover { get; set; }
        public string BoardId { get; set; } = string.Empty;
        public string BoardTitle { get; set; } = string.Empty;
        public string ColumnId { get; set; } = string.Empty;
        public string ColumnTitle { get; set; } = string.Empty;
        public DateTime? CreatedAt { get; set; }
        public DateTime? LastModified { get; set; }
    }
}