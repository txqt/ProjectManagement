using Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Models.Domain.Entities;

namespace ProjectManagement.Authorization
{
    public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PermissionAuthorizationHandler> _logger;

        public PermissionAuthorizationHandler(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            ApplicationDbContext context,
            ILogger<PermissionAuthorizationHandler> logger)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
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

            var userId = _userManager.GetUserId(context.User);
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogDebug("UserId not found");
                return;
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                _logger.LogDebug("User not found: {UserId}", userId);
                return;
            }

            _logger.LogDebug("Checking permission: {Permission} for user: {UserId}",
                requirement.Permission, userId);

            // 1. Check System-Level Permissions first
            if (await HasSystemPermissionAsync(user, requirement.Permission))
            {
                _logger.LogDebug("System permission granted: {Permission}", requirement.Permission);
                context.Succeed(requirement);
                return;
            }

            // 2. Check Board-Level Permissions
            if (await HasBoardPermissionAsync(userId, requirement.Permission, context))
            {
                _logger.LogDebug("Board permission granted: {Permission}", requirement.Permission);
                context.Succeed(requirement);
                return;
            }

            _logger.LogDebug("Permission denied: {Permission} for user: {UserId}",
                requirement.Permission, userId);
        }

        private async Task<bool> HasSystemPermissionAsync(ApplicationUser user, string permission)
        {
            // Check if it's a system-level permission
            if (!Permissions.GetSystemPermissions().Contains(permission))
            {
                return false;
            }

            // Check system roles and permissions
            var userRoles = await _userManager.GetRolesAsync(user);
            foreach (var roleName in userRoles)
            {
                var role = await _roleManager.FindByNameAsync(roleName);
                if (role != null)
                {
                    var roleClaims = await _roleManager.GetClaimsAsync(role);
                    if (roleClaims.Any(c => c.Type == "permission" && c.Value == permission))
                    {
                        return true;
                    }
                }
            }

            // Check direct user permissions
            var userClaims = await _userManager.GetClaimsAsync(user);
            return userClaims.Any(c => c.Type == "permission" && c.Value == permission);
        }

        private async Task<bool> HasBoardPermissionAsync(
            string userId,
            string permission,
            AuthorizationHandlerContext context)
        {
            // Check if it's a board-level permission
            if (!Permissions.GetBoardLevelPermissions().Contains(permission))
            {
                return false;
            }

            // Special case: boards.create is system-wide (user can create new boards)
            if (permission == Permissions.Boards.Create)
            {
                return await HasBasicUserPermission(userId);
            }

            // Get board ID from context
            var boardId = GetBoardIdFromContext(context);
            if (string.IsNullOrEmpty(boardId))
            {
                _logger.LogDebug("BoardId not found in context for permission: {Permission}", permission);
                return false;
            }

            // Check board access and permissions
            return await CheckBoardPermissionAsync(userId, boardId, permission);
        }

        private async Task<bool> CheckBoardPermissionAsync(string userId, string boardId, string permission)
        {
            var board = await _context.Boards
                .Include(b => b.Members)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null)
            {
                _logger.LogDebug("Board not found: {BoardId}", boardId);
                return false;
            }

            // Board owner has all permissions
            if (board.OwnerId == userId)
            {
                _logger.LogDebug("User is board owner: {UserId}, BoardId: {BoardId}", userId, boardId);
                return true;
            }

            // Check membership and role-based permissions
            var membership = board.Members.FirstOrDefault(m => m.UserId == userId);
            if (membership == null)
            {
                // Check if board is public and permission is view-only
                if (board.Type == "public" && IsViewOnlyPermission(permission))
                {
                    _logger.LogDebug("Public board view access granted: {BoardId}", boardId);
                    return true;
                }

                _logger.LogDebug("User is not a board member: {UserId}, BoardId: {BoardId}", userId, boardId);
                return false;
            }

            // Check role permissions
            var rolePermissions = BoardRolePermissions.GetPermissionsForRole(membership.Role);
            var hasPermission = rolePermissions.Contains(permission);

            _logger.LogDebug("Board role permission check: User: {UserId}, Board: {BoardId}, Role: {Role}, Permission: {Permission}, Granted: {Granted}",
                userId, boardId, membership.Role, permission, hasPermission);

            return hasPermission;
        }

        private async Task<bool> HasBasicUserPermission(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return false;

            var roles = await _userManager.GetRolesAsync(user);
            return roles.Any(r => r == "User" || r == "Admin");
        }

        private string? GetBoardIdFromContext(AuthorizationHandlerContext context)
        {
            // Try multiple ways to get board ID
            if (context.Resource is HttpContext httpContext)
            {
                // From route parameters
                if (httpContext.Request.RouteValues.TryGetValue("boardId", out var boardIdValue))
                {
                    return boardIdValue?.ToString();
                }

                // From query parameters
                if (httpContext.Request.Query.TryGetValue("boardId", out var queryBoardId))
                {
                    return queryBoardId.ToString();
                }

                // Try to extract from URL path
                var path = httpContext.Request.Path.Value;
                if (!string.IsNullOrEmpty(path))
                {
                    var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
                    for (int i = 0; i < segments.Length - 1; i++)
                    {
                        if (segments[i] == "boards" && i + 1 < segments.Length)
                        {
                            return segments[i + 1];
                        }
                    }
                }
            }

            return null;
        }

        private static bool IsViewOnlyPermission(string permission)
        {
            return permission == Permissions.Boards.View ||
                   permission == Permissions.Columns.View ||
                   permission == Permissions.Cards.View;
        }
    }
}
