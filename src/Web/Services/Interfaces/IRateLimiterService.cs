using ProjectManagement.Models.DTOs.RateLimit;

namespace ProjectManagement.Services.Interfaces
{
    public interface IRateLimiterService
    {
        Task<RateLimitResult> CheckRateLimitAsync(
            string identifier, 
            string endpoint,
            RateLimitPolicy policy);
        
        Task ResetLimitAsync(string identifier);
    }
}