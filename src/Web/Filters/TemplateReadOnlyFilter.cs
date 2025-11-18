using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Attributes;
using ProjectManagement.Data;
using ProjectManagement.Models.Common;

namespace ProjectManagement.Filters
{
    public class TemplateReadOnlyFilter : IAsyncActionFilter
    {
        private readonly ApplicationDbContext _context;

        public TemplateReadOnlyFilter(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            // Check xem action có attribute [RequireNotTemplate] không
            var hasAttribute = context.ActionDescriptor.EndpointMetadata
                .OfType<RequireNotTemplateAttribute>()
                .Any();

            if (!hasAttribute)
            {
                await next();
                return;
            }

            // Tìm boardId trong route parameters hoặc request body
            string? boardId = null;

            // Check route parameters
            if (context.RouteData.Values.TryGetValue("boardId", out var routeBoardId))
            {
                boardId = routeBoardId?.ToString();
            }

            // Check trong action parameters
            if (boardId == null)
            {
                foreach (var param in context.ActionArguments.Values)
                {
                    if (param is IBoardIdentifiable identifiable)
                    {
                        boardId = identifiable.BoardId;
                        break;
                    }

                    // Check nếu có property BoardId
                    var boardIdProp = param?.GetType().GetProperty("BoardId");
                    if (boardIdProp != null)
                    {
                        boardId = boardIdProp.GetValue(param)?.ToString();
                        if (boardId != null) break;
                    }
                }
            }

            if (string.IsNullOrEmpty(boardId))
            {
                await next();
                return;
            }

            // Fetch board và check type
            var board = await _context.Boards
                .Where(b => b.Id == boardId)
                .Select(b => new { b.Id, b.Type })
                .FirstOrDefaultAsync();

            if (board == null)
            {
                context.Result = new NotFoundObjectResult(new { message = "Board not found" });
                return;
            }

            if (board.Type == BoardType.Template)
            {
                context.Result = new BadRequestObjectResult(new
                {
                    message = "Cannot modify template boards. Templates are read-only."
                });
                return;
            }

            await next();
        }
    }

// Interface để identify objects có BoardId
    public interface IBoardIdentifiable
    {
        string BoardId { get; }
    }
}