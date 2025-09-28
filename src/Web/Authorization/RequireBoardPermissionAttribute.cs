using Microsoft.AspNetCore.Authorization;

namespace ProjectManagement.Authorization
{
    public class RequireBoardPermissionAttribute : AuthorizeAttribute
    {
        public RequireBoardPermissionAttribute(string permission)
        {
            Policy = $"Permission.{permission}";
        }
    }
}
