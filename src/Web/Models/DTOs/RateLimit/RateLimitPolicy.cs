namespace ProjectManagement.Models.DTOs.RateLimit
{
    public class RateLimitPolicy
    {
        public int RequestsPerMinute { get; set; } = 60;
        public int RequestsPerHour { get; set; } = 1000;
    }
}