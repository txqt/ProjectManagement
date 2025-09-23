namespace ProjectManagement.Models.DTOs.Attachment
{
    public class AttachmentDto
    {
        public string Id { get; set; } = string.Empty;
        public string CardId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
