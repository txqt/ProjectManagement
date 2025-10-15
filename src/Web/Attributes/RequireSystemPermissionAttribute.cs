using Microsoft.AspNetCore.Authorization;

namespace ProjectManagement.Attributes
{
    public class RequireSystemPermissionAttribute : AuthorizeAttribute
    {
        public RequireSystemPermissionAttribute(string permission)
        {
            Policy = $"Permission.{permission}";
        }
    }
}
