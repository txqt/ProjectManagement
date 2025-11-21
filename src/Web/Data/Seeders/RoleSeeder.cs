using Microsoft.AspNetCore.Identity;
using ProjectManagement.Authorization;

namespace ProjectManagement.Data.Seeders
{
    public static class RoleSeeder
    {
        public static async Task SeedRoles(RoleManager<IdentityRole> roleManager)
        {
            var rolesHierarchy = new Dictionary<string, string[]>
            {
                { "SuperAdmin", new[] { "Admin", "User" } },
                { "Admin", new[] { "User" } },
                { "User", Array.Empty<string>() }
            };

            var basePermissions = new Dictionary<string, string[]>
            {
                { "SuperAdmin", Permissions.GetAllPermissions().ToArray() },
                { "Admin", new[] { Permissions.System.ViewAllUsers, Permissions.System.ViewSystemStats } },
                { "User", Permissions.GetBoardLevelPermissions().ToArray() }
            };

            // Lưu lại quyền hợp nhất (đã kế thừa) của mỗi role
            var mergedPermissions = new Dictionary<string, HashSet<string>>();

            // Xử lý tuần tự (role cấp thấp trước, cao sau)
            foreach (var roleName in rolesHierarchy.Keys)
            {
                // Bắt đầu với quyền gốc
                var perms = new HashSet<string>(basePermissions[roleName]);

                // Kế thừa quyền từ role khác
                foreach (var parent in rolesHierarchy[roleName])
                {
                    if (mergedPermissions.TryGetValue(parent, out var inheritedPerms))
                    {
                        perms.UnionWith(inheritedPerms);
                    }
                }

                mergedPermissions[roleName] = perms;

                // Tạo role nếu chưa có
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    var role = new IdentityRole(roleName);
                    await roleManager.CreateAsync(role);

                    // Gán toàn bộ quyền
                    foreach (var permission in perms)
                    {
                        await roleManager.AddClaimAsync(role,
                            new System.Security.Claims.Claim("permission", permission));
                    }
                }
            }
        }
    }
}
