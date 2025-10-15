using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using ProjectManagement.Models.DTOs.RateLimit;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Attributes
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class RateLimitAttribute : Attribute, IAsyncActionFilter
    {
        public int RequestsPerMinute { get; set; } = 60;
        public int RequestsPerHour { get; set; } = 1000;
        public bool BypassForAdmin { get; set; } = true;

        public async Task OnActionExecutionAsync(
            ActionExecutingContext context,
            ActionExecutionDelegate next)
        {
            var rateLimiter = context.HttpContext.RequestServices
                .GetRequiredService<IRateLimiterService>();

            var logger = context.HttpContext.RequestServices
                .GetRequiredService<ILogger<RateLimitAttribute>>();

            // Bypass cho Admin nếu được phép
            if (BypassForAdmin && context.HttpContext.User.IsInRole("Admin"))
            {
                await next();
                return;
            }

            var identifier = GetIdentifier(context.HttpContext);
            var endpoint = GetEndpointPath(context.HttpContext);

            var policy = new RateLimitPolicy
            {
                RequestsPerMinute = RequestsPerMinute,
                RequestsPerHour = RequestsPerHour
            };

            var result = await rateLimiter.CheckRateLimitAsync(
                identifier, 
                endpoint, 
                policy);

            // Thêm headers
            context.HttpContext.Response.Headers["X-RateLimit-Limit"] = 
                RequestsPerMinute.ToString();
            context.HttpContext.Response.Headers["X-RateLimit-Remaining"] = 
                result.RemainingRequests.ToString();

            if (!result.IsAllowed)
            {
                context.HttpContext.Response.Headers["Retry-After"] = 
                    result.RetryAfterSeconds.ToString();

                context.Result = new ObjectResult(new
                {
                    error = "Rate limit exceeded",
                    message = result.Message,
                    retryAfter = result.RetryAfterSeconds
                })
                {
                    StatusCode = StatusCodes.Status429TooManyRequests
                };

                logger.LogWarning(
                    "Rate limit exceeded for {Identifier} at {Endpoint}",
                    identifier, endpoint);

                return;
            }

            await next();
        }

        private string GetIdentifier(HttpContext context)
        {
            // Ưu tiên User ID
            var userId = context.User?.Identity?.Name;
            if (!string.IsNullOrEmpty(userId))
                return $"user:{userId}";

            // Fallback sang IP
            var ip = context.Connection.RemoteIpAddress?.ToString() 
                ?? context.Request.Headers["X-Forwarded-For"].FirstOrDefault() 
                ?? "unknown";
            
            return $"ip:{ip}";
        }

        private string GetEndpointPath(HttpContext context)
        {
            var path = context.Request.Path.Value?.ToLower() ?? "unknown";
            var method = context.Request.Method;
            return $"{method}:{path}";
        }
    }
}