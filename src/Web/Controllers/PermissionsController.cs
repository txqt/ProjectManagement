using Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Authorization;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Permission;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PermissionsController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ApplicationDbContext _context;

        public PermissionsController(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            ApplicationDbContext context)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
        }

        [HttpGet("my-permissions")]
        public async Task<ActionResult<UserPermissionsDto>> GetMyPermissions()
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = new UserPermissionsDto
            {
                UserId = userId,
                SystemPermissions = await GetUserSystemPermissions(userId),
                BoardPermissions = await GetUserBoardPermissions(userId)
            };

            return Ok(result);
        }

        [HttpPost("check-board-permission")]
        public async Task<ActionResult<PermissionCheckResultDto>> CheckBoardPermission(
            [FromBody] BoardPermissionCheckDto request)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var hasPermission = await CheckUserBoardPermission(userId, request.BoardId, request.Permission);

            return Ok(new PermissionCheckResultDto
            {
                HasPermission = hasPermission.HasPermission,
                Reason = hasPermission.Reason
            });
        }

        [HttpGet("available-permissions")]
        [RequireSystemPermission(Permissions.System.ManageUsers)]
        public ActionResult<object> GetAvailablePermissions()
        {
            return Ok(new
            {
                SystemPermissions = Permissions.GetSystemPermissions(),
                BoardPermissions = Permissions.GetBoardLevelPermissions(),
                BoardRoles = new[] { "owner", "admin", "member", "viewer" }
            });
        }

        private async Task<List<string>> GetUserSystemPermissions(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return new List<string>();

            var permissions = new HashSet<string>();

            // Get permissions from roles
            var roles = await _userManager.GetRolesAsync(user);
            foreach (var roleName in roles)
            {
                var role = await _roleManager.FindByNameAsync(roleName);
                if (role != null)
                {
                    var roleClaims = await _roleManager.GetClaimsAsync(role);
                    var rolePermissions = roleClaims
                        .Where(c => c.Type == "permission" && Permissions.GetSystemPermissions().Contains(c.Value))
                        .Select(c => c.Value);

                    foreach (var permission in rolePermissions)
                    {
                        permissions.Add(permission);
                    }
                }
            }

            // Get direct user permissions (system level)
            var userClaims = await _userManager.GetClaimsAsync(user);
            var userSystemPermissions = userClaims
                .Where(c => c.Type == "permission" && Permissions.GetSystemPermissions().Contains(c.Value))
                .Select(c => c.Value);

            foreach (var permission in userSystemPermissions)
            {
                permissions.Add(permission);
            }

            return permissions.ToList();
        }

        private async Task<Dictionary<string, List<string>>> GetUserBoardPermissions(string userId)
        {
            var result = new Dictionary<string, List<string>>();

            // Get boards where user is owner or member
            var boards = await _context.Boards
                .Include(b => b.Members)
                .Where(b => b.OwnerId == userId || b.Members.Any(m => m.UserId == userId))
                .ToListAsync();

            foreach (var board in boards)
            {
                var permissions = new List<string>();

                if (board.OwnerId == userId)
                {
                    // Owner has all board permissions
                    permissions.AddRange(BoardRolePermissions.OwnerPermissions);
                }
                else
                {
                    // Get permissions based on membership role
                    var membership = board.Members.FirstOrDefault(m => m.UserId == userId);
                    if (membership != null)
                    {
                        permissions.AddRange(BoardRolePermissions.GetPermissionsForRole(membership.Role));
                    }
                }

                result[board.Id] = permissions;
            }

            return result;
        }

        private async Task<(bool HasPermission, string Reason)> CheckUserBoardPermission(
            string userId, string boardId, string permission)
        {
            var board = await _context.Boards
                .Include(b => b.Members)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null)
                return (false, "Board not found");

            // Check if user is owner
            if (board.OwnerId == userId)
                return (true, "User is board owner");

            // Check membership
            var membership = board.Members.FirstOrDefault(m => m.UserId == userId);
            if (membership == null)
            {
                // Check if board is public and permission is view-only
                if (board.Type == "public" &&
                    (permission == Permissions.Boards.View ||
                     permission == Permissions.Columns.View ||
                     permission == Permissions.Cards.View))
                {
                    return (true, "Public board view access");
                }

                return (false, "User is not a board member");
            }

            // Check role permissions
            var rolePermissions = BoardRolePermissions.GetPermissionsForRole(membership.Role);
            if (rolePermissions.Contains(permission))
                return (true, $"Permission granted through role: {membership.Role}");

            return (false, $"Role '{membership.Role}' does not have permission '{permission}'");
        }
    }
}
