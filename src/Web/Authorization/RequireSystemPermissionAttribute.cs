using Microsoft.AspNetCore.Authorization;

namespace ProjectManagement.Authorization
{
    public class RequireSystemPermissionAttribute : AuthorizeAttribute
    {
        public RequireSystemPermissionAttribute(string permission)
        {
            Policy = $"Permission.{permission}";
        }
    }
}
