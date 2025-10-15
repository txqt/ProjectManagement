using ProjectManagement.Middleware;

namespace ProjectManagement.Extensions
{
    public static class GlobalRateLimitMiddlewareExtensions
    {
        public static IApplicationBuilder UseGlobalRateLimit(
            this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<GlobalRateLimitMiddleware>();
        }
    }
}