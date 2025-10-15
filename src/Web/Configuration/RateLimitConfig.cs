namespace ProjectManagement.Configuration
{
    public class RateLimitConfig
    {
        public int RequestsPerMinute { get; set; } = 60;
        public int RequestsPerHour { get; set; } = 1000;
        public Dictionary<string, EndpointRateLimit> EndpointLimits { get; set; } = new();
    }
}