namespace ProjectManagement.Configuration
{
    public class EndpointRateLimit
    {
        public string Pattern { get; set; } // Regex pattern hoặc path
        public int RequestsPerMinute { get; set; }
        public int RequestsPerHour { get; set; }
        public bool RequireAuth { get; set; } = true;
        public string[] AllowedRoles { get; set; } = Array.Empty<string>();
    }
}