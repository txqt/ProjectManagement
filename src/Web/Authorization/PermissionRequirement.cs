using Microsoft.AspNetCore.Authorization;

namespace ProjectManagement.Authorization
{
    public class PermissionRequirement : IAuthorizationRequirement
    {
        public string Permission { get; }
        public string? BoardId { get; }

        public PermissionRequirement(string permission, string? boardId = null)
        {
            Permission = permission;
            BoardId = boardId;
        }
    }
}
