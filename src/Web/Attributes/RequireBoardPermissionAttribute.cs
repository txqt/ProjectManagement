using Microsoft.AspNetCore.Authorization;

namespace ProjectManagement.Attributes
{
    public class RequireBoardPermissionAttribute : AuthorizeAttribute
    {
        public RequireBoardPermissionAttribute(string permission)
        {
            Policy = $"Permission.{permission}";
        }
    }
}
