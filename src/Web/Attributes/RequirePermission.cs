using Microsoft.AspNetCore.Authorization;

namespace ProjectManagement.Attributes
{
    public class RequirePermission : AuthorizeAttribute
    {
        public RequirePermission(string permission)
        {
            Policy = $"Permission.{permission}";
        }
    }
}