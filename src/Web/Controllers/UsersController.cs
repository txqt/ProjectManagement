using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public UsersController(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        // GET api/users/search?q=thanh&page=1&pageSize=10
        [HttpGet("search")]
        [Authorize] // hoặc policy phù hợp
        public async Task<ActionResult<PagedResult<UserSearchDto>>> Search(
            [FromQuery] string q,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            if (string.IsNullOrWhiteSpace(q))
                return BadRequest("Query is required.");

            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            // Dùng NormalizedUserName / NormalizedEmail để tìm (tránh tải quá nhiều dữ liệu)
            var normalized = q.Trim().ToUpperInvariant();

            var usersQuery = _userManager.Users
                .Where(u =>
                    (!string.IsNullOrEmpty(u.NormalizedUserName) && u.NormalizedUserName.Contains(normalized)) ||
                    (!string.IsNullOrEmpty(u.NormalizedEmail) && u.NormalizedEmail.Contains(normalized))
                );

            var total = await usersQuery.CountAsync();

            var items = await usersQuery
                .OrderBy(u => u.UserName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new UserSearchDto
                {
                    Id = u.Id,
                    UserName = u.UserName,
                    Email = u.Email,
                    Avatar = u.Avatar // đổi theo property model của bạn (null nếu không có)
                })
                .ToListAsync();

            var result = new PagedResult<UserSearchDto>
            {
                Items = items,
                Page = page,
                PageSize = pageSize,
                TotalCount = total
            };

            return Ok(result);
        }
    }
}
