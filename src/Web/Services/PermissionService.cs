using ProjectManagement.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Authorization;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Services
{
    public class PermissionService : IPermissionService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PermissionService> _logger;
        private const string PermissionClaimType = "permission";

        public PermissionService(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            ApplicationDbContext context,
            ILogger<PermissionService> logger)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
            _logger = logger;
        }

        public async Task<List<string>> GetUserSystemPermissionsAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return new List<string>();

            var permissions = new HashSet<string>();

            var roles = await _userManager.GetRolesAsync(user);
            foreach (var roleName in roles)
            {
                var role = await _roleManager.FindByNameAsync(roleName);
                if (role == null) continue;

                var roleClaims = await _roleManager.GetClaimsAsync(role);
                var rolePermissions = roleClaims
                    .Where(c => c.Type == PermissionClaimType && Permissions.GetSystemPermissions().Contains(c.Value))
                    .Select(c => c.Value);

                foreach (var p in rolePermissions) permissions.Add(p);
            }

            var userClaims = await _userManager.GetClaimsAsync(user);
            var userSystemPermissions = userClaims
                .Where(c => c.Type == PermissionClaimType && Permissions.GetSystemPermissions().Contains(c.Value))
                .Select(c => c.Value);

            foreach (var p in userSystemPermissions) permissions.Add(p);

            return permissions.ToList();
        }

        public async Task<Dictionary<string, List<string>>> GetUserBoardPermissionsAsync(string userId)
        {
            var result = new Dictionary<string, List<string>>();

            var boards = await _context.Boards
                .Include(b => b.Members)
                .Where(b => b.OwnerId == userId || b.Members.Any(m => m.UserId == userId))
                .ToListAsync();

            foreach (var board in boards)
            {
                var permissions = new List<string>();
                if (board.OwnerId == userId)
                    permissions.AddRange(BoardRolePermissions.OwnerPermissions);
                else
                {
                    var membership = board.Members.FirstOrDefault(m => m.UserId == userId);
                    if (membership != null)
                        permissions.AddRange(BoardRolePermissions.GetPermissionsForRole(membership.Role));
                }

                result[board.Id] = permissions;
            }

            return result;
        }

        public async Task<bool> HasSystemPermissionAsync(string userId, string permission)
        {
            if (!Permissions.GetSystemPermissions().Contains(permission)) return false;

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return false;

            var roles = await _userManager.GetRolesAsync(user);
            foreach (var roleName in roles)
            {
                var role = await _roleManager.FindByNameAsync(roleName);
                if (role == null) continue;
                var roleClaims = await _roleManager.GetClaimsAsync(role);
                if (roleClaims.Any(c => c.Type == PermissionClaimType && c.Value == permission))
                    return true;
            }

            var userClaims = await _userManager.GetClaimsAsync(user);
            return userClaims.Any(c => c.Type == PermissionClaimType && c.Value == permission);
        }

        // Returns (bool, reason)
        public async Task<(bool HasPermission, string Reason)> CheckBoardPermissionAsync(string userId, string boardId,
            string permission)
        {
            var board = await _context.Boards
                .Include(b => b.Members)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null) return (false, "Board not found");

            if (board.OwnerId == userId) return (true, "Board owner");

            var membership = board.Members.FirstOrDefault(m => m.UserId == userId);
            if (membership == null)
            {
                if (board.Type == "public" && IsViewOnlyPermission(permission))
                    return (true, "Public board view access");

                return (false, "User is not a board member");
            }

            var rolePermissions = BoardRolePermissions.GetPermissionsForRole(membership.Role);
            if (rolePermissions.Contains(permission))
                return (true, $"Granted through role {membership.Role}");

            return (false, $"Role '{membership.Role}' does not have permission '{permission}'");
        }

        private static bool IsViewOnlyPermission(string permission)
        {
            return permission == Permissions.Boards.View ||
                   permission == Permissions.Columns.View ||
                   permission == Permissions.Cards.View;
        }
    }
}