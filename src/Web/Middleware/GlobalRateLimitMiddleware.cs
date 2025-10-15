using Microsoft.Extensions.Options;
using ProjectManagement.Configuration;
using ProjectManagement.Models.DTOs.RateLimit;
using ProjectManagement.Services.Interfaces;
using System.Text.RegularExpressions;

namespace ProjectManagement.Middleware
{
    public class GlobalRateLimitMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly RateLimitConfig _config;
        private readonly ILogger<GlobalRateLimitMiddleware> _logger;

        public GlobalRateLimitMiddleware(
            RequestDelegate next,
            IOptions<RateLimitConfig> config,
            ILogger<GlobalRateLimitMiddleware> logger)
        {
            _next = next;
            _config = config.Value;
            _logger = logger;
        }

        public async Task InvokeAsync(
            HttpContext context,
            IRateLimiterService rateLimiter)
        {
            // Skip rate limit cho các paths cụ thể
            if (ShouldSkipRateLimit(context))
            {
                await _next(context);
                return;
            }

            // Lấy policy cho endpoint
            var policy = GetPolicyForEndpoint(context);

            // Bypass cho Admin nếu cấu hình cho phép
            if (policy.AllowedRoles?.Contains("Admin") == true
                && context.User.IsInRole("Admin"))
            {
                await _next(context);
                return;
            }

            // Check authentication nếu yêu cầu
            if (policy.RequireAuth && !context.User.Identity?.IsAuthenticated == true)
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsJsonAsync(new { error = "Authentication required" });
                return;
            }

            var identifier = GetIdentifier(context);
            var endpoint = GetEndpointPath(context);

            var rateLimitPolicy = new RateLimitPolicy
            {
                RequestsPerMinute = policy.RequestsPerMinute, RequestsPerHour = policy.RequestsPerHour
            };

            var result = await rateLimiter.CheckRateLimitAsync(
                identifier,
                endpoint,
                rateLimitPolicy);

            // Thêm rate limit headers
            context.Response.Headers["X-RateLimit-Limit"] =
                policy.RequestsPerMinute.ToString();
            context.Response.Headers["X-RateLimit-Remaining"] =
                result.RemainingRequests.ToString();

            if (!result.IsAllowed)
            {
                context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.Response.Headers["Retry-After"] =
                    result.RetryAfterSeconds.ToString();

                await context.Response.WriteAsJsonAsync(new
                {
                    error = "Rate limit exceeded", message = result.Message, retryAfter = result.RetryAfterSeconds
                });

                _logger.LogWarning(
                    "Rate limit exceeded: {Identifier} at {Endpoint}",
                    identifier, endpoint);

                return;
            }

            await _next(context);
        }

        private bool ShouldSkipRateLimit(HttpContext context)
        {
            var path = context.Request.Path.Value?.ToLower() ?? "";

            // Skip cho health checks, swagger, static files
            var skipPaths = new[] { "/health", "/swagger", "/api/auth/login", "/api/auth/register" };

            return skipPaths.Any(p => path.StartsWith(p));
        }

        private EndpointRateLimit GetPolicyForEndpoint(HttpContext context)
        {
            var path = context.Request.Path.Value?.ToLower() ?? "";

            // Tìm policy match với endpoint
            foreach (var (pattern, policy) in _config.EndpointLimits)
            {
                if (Regex.IsMatch(path, pattern, RegexOptions.IgnoreCase))
                {
                    return policy;
                }
            }

            // Default policy
            return new EndpointRateLimit
            {
                RequestsPerMinute = _config.RequestsPerMinute,
                RequestsPerHour = _config.RequestsPerHour,
                RequireAuth = true
            };
        }

        private string GetIdentifier(HttpContext context)
        {
            var userId = context.User?.Identity?.Name;
            if (!string.IsNullOrEmpty(userId))
                return $"user:{userId}";

            var ip = context.Connection.RemoteIpAddress?.ToString()
                     ?? context.Request.Headers["X-Forwarded-For"].FirstOrDefault()
                     ?? context.Request.Headers["X-Real-IP"].FirstOrDefault()
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