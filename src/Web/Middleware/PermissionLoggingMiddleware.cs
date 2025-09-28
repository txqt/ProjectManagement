using Microsoft.AspNetCore.Identity;
using ProjectManagement.Models.Domain.Entities;

namespace ProjectManagement.Middleware
{
    public class PermissionLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<PermissionLoggingMiddleware> _logger;

        public PermissionLoggingMiddleware(RequestDelegate next, ILogger<PermissionLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, UserManager<ApplicationUser> userManager)
        {
            // Log permission checks for debugging (only in development)
            if (context.User.Identity?.IsAuthenticated == true &&
                Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
            {
                var userId = userManager.GetUserId(context.User);
                var endpoint = context.Request.Path + context.Request.QueryString;
                var method = context.Request.Method;

                _logger.LogDebug("Request: {Method} {Endpoint} by User: {UserId}",
                    method, endpoint, userId);

                // Log user roles
                var user = await userManager.FindByIdAsync(userId ?? "");
                if (user != null)
                {
                    var roles = await userManager.GetRolesAsync(user);
                    _logger.LogDebug("User {UserId} has roles: {Roles}", userId, string.Join(", ", roles));
                }
            }

            await _next(context);
        }
    }
}
