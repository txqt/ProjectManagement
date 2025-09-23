using Microsoft.AspNetCore.Authorization;

namespace ProjectManagement.Authorization
{
    public class HasPermissionAttribute : AuthorizeAttribute
    {
        public HasPermissionAttribute(string permission)
        {
            Policy = $"Permission.{permission}";
        }
    }
}
