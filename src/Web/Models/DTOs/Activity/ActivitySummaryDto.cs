namespace ProjectManagement.Models.DTOs.Activity
{
    public class ActivitySummaryDto
    {
        public int TotalActivities { get; set; }
        public int TodayActivities { get; set; }
        public int ThisWeekActivities { get; set; }
        public Dictionary<string, int> ActionCounts { get; set; } = new();
        public Dictionary<string, int> UserActivityCounts { get; set; } = new();
        public List<ActivityLogDto> RecentActivities { get; set; } = new();
    }
}