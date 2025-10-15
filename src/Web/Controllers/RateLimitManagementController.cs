using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Attributes;
using ProjectManagement.Authorization;
using ProjectManagement.Models.DTOs.RateLimit;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/admin/[controller]")]
    [Authorize(Roles = "SuperAdmin, Admin")]
    public class RateLimitManagementController : ControllerBase
    {
        private readonly IRateLimiterService _rateLimiter;

        public RateLimitManagementController(IRateLimiterService rateLimiter)
        {
            _rateLimiter = rateLimiter;
        }

        [HttpPost("reset/{identifier}")]
        public async Task<ActionResult> ResetLimit(string identifier)
        {
            await _rateLimiter.ResetLimitAsync(identifier);
            return Ok(new { message = $"Rate limit reset for {identifier}" });
        }

        [HttpGet("status/{identifier}")]
        public async Task<ActionResult> GetLimitStatus(string identifier)
        {
            var result = await _rateLimiter.CheckRateLimitAsync(
                identifier,
                "status-check",
                new RateLimitPolicy { RequestsPerMinute = 1000, RequestsPerHour = 10000 });

            return Ok(new
            {
                identifier,
                remainingRequests = result.RemainingRequests,
                isAllowed = result.IsAllowed
            });
        }
    }
}