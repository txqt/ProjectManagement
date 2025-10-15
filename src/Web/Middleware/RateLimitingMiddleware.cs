using StackExchange.Redis;
using System.Net;

namespace ProjectManagement.Middleware
{
    public class RateLimitingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IConnectionMultiplexer _redis;
        private readonly ILogger<RateLimitingMiddleware> _logger;

        public RateLimitingMiddleware(
            RequestDelegate next,
            IConnectionMultiplexer redis,
            ILogger<RateLimitingMiddleware> logger)
        {
            _next = next;
            _redis = redis;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var endpoint = context.GetEndpoint();
            var rateLimitAttribute = endpoint?.Metadata.GetMetadata<RateLimitAttribute>();

            if (rateLimitAttribute != null)
            {
                var clientId = GetClientIdentifier(context);
                var key = $"ratelimit:{rateLimitAttribute.Name}:{clientId}";

                var db = _redis.GetDatabase();
                var currentCount = await db.StringIncrementAsync(key);

                if (currentCount == 1)
                {
                    await db.KeyExpireAsync(key, rateLimitAttribute.Window);
                }

                if (currentCount > rateLimitAttribute.MaxRequests)
                {
                    _logger.LogWarning("Rate limit exceeded for {ClientId} on {Endpoint}", 
                        clientId, rateLimitAttribute.Name);

                    context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                    context.Response.Headers["Retry-After"] = rateLimitAttribute.Window.TotalSeconds.ToString();
                    
                    await context.Response.WriteAsJsonAsync(new
                    {
                        error = "Too many requests",
                        message = $"Rate limit exceeded. Maximum {rateLimitAttribute.MaxRequests} requests per {rateLimitAttribute.Window.TotalMinutes} minutes.",
                        retryAfter = rateLimitAttribute.Window.TotalSeconds
                    });
                    return;
                }

                // Add headers để client biết limit
                context.Response.Headers["X-RateLimit-Limit"] = rateLimitAttribute.MaxRequests.ToString();
                context.Response.Headers["X-RateLimit-Remaining"] = (rateLimitAttribute.MaxRequests - currentCount).ToString();
            }

            await _next(context);
        }

        private string GetClientIdentifier(HttpContext context)
        {
            // Ưu tiên user ID nếu đã authenticated
            var userId = context.User?.FindFirst("sub")?.Value 
                      ?? context.User?.FindFirst("userId")?.Value;
            
            if (!string.IsNullOrEmpty(userId))
                return $"user:{userId}";

            // Fallback to IP address
            var ipAddress = context.Connection.RemoteIpAddress?.ToString() 
                         ?? context.Request.Headers["X-Forwarded-For"].FirstOrDefault() 
                         ?? "unknown";
            
            return $"ip:{ipAddress}";
        }
    }

    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public class RateLimitAttribute : Attribute
    {
        public string Name { get; }
        public int MaxRequests { get; }
        public TimeSpan Window { get; }

        public RateLimitAttribute(string name, int maxRequests, int windowMinutes)
        {
            Name = name;
            MaxRequests = maxRequests;
            Window = TimeSpan.FromMinutes(windowMinutes);
        }
    }
}