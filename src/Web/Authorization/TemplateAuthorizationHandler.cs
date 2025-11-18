using Microsoft.AspNetCore.Authorization;
using ProjectManagement.Models.Common;
using ProjectManagement.Models.Domain.Entities;

namespace ProjectManagement.Authorization
{
    public class NotTemplateRequirement : IAuthorizationRequirement { }

    public class NotTemplateAuthorizationHandler : AuthorizationHandler<NotTemplateRequirement, Board>
    {
        protected override Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            NotTemplateRequirement requirement,
            Board board)
        {
            // Nếu board không phải template, cho phép
            if (board.Type != BoardType.Template)
            {
                context.Succeed(requirement);
            }
        
            return Task.CompletedTask;
        }
    }
}