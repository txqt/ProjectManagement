namespace ProjectManagement.Models.DTOs.Activity
{
    public class ActivityFilterDto
    {
        public string? UserId { get; set; }
        public string? EntityType { get; set; }
        public string? Action { get; set; }
        public string? CardId { get; set; }
        public string? ColumnId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int Skip { get; set; } = 0;
        public int Take { get; set; } = 50;
    }
}