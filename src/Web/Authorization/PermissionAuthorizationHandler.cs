using Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Authorization
{
    public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
    {
        private readonly IPermissionService _permissionService;
        private readonly ILogger<PermissionAuthorizationHandler> _logger;

        public PermissionAuthorizationHandler(IPermissionService permissionService,
            ILogger<PermissionAuthorizationHandler> logger)
        {
            _permissionService = permissionService;
            _logger = logger;
        }

        protected override async Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            PermissionRequirement requirement)
        {
            if (context.User?.Identity?.IsAuthenticated != true)
            {
                _logger.LogDebug("User not authenticated");
                return;
            }

            // Get userId via UserManager not available here; we'll use NameIdentifier claim
            var userIdClaim = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                _logger.LogDebug("UserId not found in claims");
                return;
            }

            var userIdResolved = userIdClaim;

            _logger.LogDebug("Checking permission {Permission} for user {UserId}", requirement.Permission,
                userIdResolved);

            // 1. System-level
            if (await _permissionService.HasSystemPermissionAsync(userIdResolved, requirement.Permission))
            {
                _logger.LogDebug("System permission granted");
                context.Succeed(requirement);
                return;
            }

            // 2. Board-level: try to use requirement.BoardId; if null try extract from resource (if resource is board id or board object)
            string? boardId = requirement.BoardId;
            if (boardId == null && context.Resource is string resourceString)
            {
                boardId = resourceString;
            }
            else if (boardId == null && context.Resource is HttpContext httpContext)
            {
                // fallback: try route/query/path (same as previous logic if needed)
                if (httpContext.Request.RouteValues.TryGetValue("boardId", out var bid))
                    boardId = bid?.ToString();
                else if (httpContext.Request.Query.TryGetValue("boardId", out var qbid))
                    boardId = qbid.ToString();
            }

            if (!string.IsNullOrEmpty(boardId))
            {
                var (ok, _) =
                    await _permissionService.CheckBoardPermissionAsync(userIdResolved, boardId, requirement.Permission);
                if (ok)
                {
                    _logger.LogDebug("Board permission granted");
                    context.Succeed(requirement);
                    return;
                }
            }

            _logger.LogDebug("Permission denied: {Permission} for user {UserId}", requirement.Permission,
                userIdResolved);
        }
    }
}