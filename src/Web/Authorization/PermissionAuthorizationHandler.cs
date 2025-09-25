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

        public PermissionAuthorizationHandler(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            ApplicationDbContext context)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
        }

        protected override async Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            PermissionRequirement requirement)
        {
            if (context.User?.Identity?.IsAuthenticated != true)
            {
                return;
            }

            var userId = _userManager.GetUserId(context.User);
            if (string.IsNullOrEmpty(userId))
            {
                return;
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return;
            }

            // Check if user has the required permission through roles
            var userRoles = await _userManager.GetRolesAsync(user);
            foreach (var roleName in userRoles)
            {
                var role = await _roleManager.FindByNameAsync(roleName);
                if (role != null)
                {
                    var roleClaims = await _roleManager.GetClaimsAsync(role);
                    if (roleClaims.Any(c => c.Type == "permission" && c.Value == requirement.Permission))
                    {
                        context.Succeed(requirement);
                        return;
                    }
                }
            }

            // Check direct user permissions
            var userClaims = await _userManager.GetClaimsAsync(user);
            if (userClaims.Any(c => c.Type == "permission" && c.Value == requirement.Permission))
            {
                context.Succeed(requirement);
                return;
            }

            // Check board-specific permissions
            if (requirement.Permission.StartsWith("boards.") ||
                requirement.Permission.StartsWith("columns.") ||
                requirement.Permission.StartsWith("cards."))
            {
                if (await HasBoardPermissionAsync(userId, requirement.Permission, context))
                {
                    context.Succeed(requirement);
                    return;
                }
            }
        }

        private async Task<bool> HasBoardPermissionAsync(
            string userId,
            string permission,
            AuthorizationHandlerContext context)
        {
            // Try to get board ID from route or resource
            var boardId = await GetBoardIdFromContext(context);
            if (string.IsNullOrEmpty(boardId))
            {
                return false;
            }

            // Check if user is board owner
            var board = await _context.Boards.FirstOrDefaultAsync(b => b.Id == boardId);
            if (board?.OwnerId == userId)
            {
                return true; // Board owners have all permissions
            }

            // Check board membership and role-based permissions
            var membership = await _context.BoardMembers
                .FirstOrDefaultAsync(bm => bm.BoardId == boardId && bm.UserId == userId);

            if (membership == null)
            {
                return false; // Not a board member
            }

            // Define role-based permissions
            return membership.Role switch
            {
                "admin" => IsAdminPermission(permission),
                "member" => IsMemberPermission(permission),
                _ => false
            };
        }

        private async Task<string?> GetBoardIdFromContext(AuthorizationHandlerContext context)
        {
            if (context.Resource is HttpContext httpContext)
            {
                // Thử lấy boardId từ route
                if (httpContext.Request.RouteValues.TryGetValue("boardId", out var boardIdValue))
                    return boardIdValue?.ToString();

                // Nếu chỉ có columnId
                if (httpContext.Request.RouteValues.TryGetValue("columnId", out var columnIdValue))
                {
                    var columnId = columnIdValue?.ToString();
                    if (!string.IsNullOrEmpty(columnId))
                    {
                        var column = await _context.Columns.FirstOrDefaultAsync(c => c.Id == columnId);
                        return column?.BoardId;
                    }
                }

                // Nếu chỉ có cardId
                if (httpContext.Request.RouteValues.TryGetValue("cardId", out var cardIdValue))
                {
                    var cardId = cardIdValue?.ToString();
                    if (!string.IsNullOrEmpty(cardId))
                    {
                        var card = await _context.Cards.FirstOrDefaultAsync(c => c.Id == cardId);
                        return card?.BoardId;
                    }
                }
            }

            return null;
        }

        private static bool IsAdminPermission(string permission)
        {
            // Admins can do everything except delete board (only owner can)
            return permission != Permissions.Boards.Delete;
        }

        private static bool IsMemberPermission(string permission)
        {
            // Members have limited permissions
            return permission switch
            {
                Permissions.Boards.View => true,
                Permissions.Columns.View => true,
                Permissions.Cards.View => true,
                Permissions.Cards.Create => true,
                Permissions.Cards.Edit => true,
                Permissions.Cards.Move => true,
                Permissions.Cards.Comment => true,
                Permissions.Cards.Attach => true,
                _ => false
            };
        }
    }
}
