namespace ProjectManagement.Models.DTOs.Search
{
    public class SearchBoardDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Type { get; set; } = string.Empty;
        public string? Cover { get; set; }
        public string? OwnerName { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? LastModified { get; set; }
    }
}