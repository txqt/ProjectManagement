namespace ProjectManagement.Models.DTOs.RateLimit
{
    public class RateLimitResult
    {
        public bool IsAllowed { get; set; }
        public int RemainingRequests { get; set; }
        public int RetryAfterSeconds { get; set; }
        public string Message { get; set; }
    }
}