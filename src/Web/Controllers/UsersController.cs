using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Authorization;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs;
using ProjectManagement.Models.DTOs.Users;
using AutoMapper;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole>  _roleManager;
        private readonly IMapper _mapper;

        public UsersController(
            UserManager<ApplicationUser> userManager, 
            RoleManager<IdentityRole> roleManager,
            IMapper mapper)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _mapper = mapper;
        }

        // GET api/users/profile
        [HttpGet("profile")]
        [Authorize]
        public async Task<ActionResult<UserDto>> GetProfile()
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new { error = "User not found" });

            var roles = await _userManager.GetRolesAsync(user);
            var userDto = _mapper.Map<UserDto>(user);
            userDto.Roles = roles.ToList();

            return Ok(userDto);
        }

        // PUT api/users/profile
        [HttpPut("profile")]
        [Authorize]
        public async Task<ActionResult<UserDto>> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new { error = "User not found" });

            // Check if username is taken by another user
            if (user.UserName != dto.UserName)
            {
                var existingUser = await _userManager.FindByNameAsync(dto.UserName);
                if (existingUser != null)
                    return BadRequest(new { error = "Username is already taken" });
            }

            // Check if email is taken by another user
            if (user.Email != dto.Email)
            {
                var existingUser = await _userManager.FindByEmailAsync(dto.Email);
                if (existingUser != null)
                    return BadRequest(new { error = "Email is already taken" });
            }

            // Update user properties
            user.UserName = dto.UserName;
            user.Email = dto.Email;
            user.Avatar = dto.Avatar;
            user.UpdatedAt = DateTime.UtcNow;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(new { error = "Failed to update profile", details = result.Errors });

            var roles = await _userManager.GetRolesAsync(user);
            var userDto = _mapper.Map<UserDto>(user);
            userDto.Roles = roles.ToList();

            return Ok(userDto);
        }

        // PUT api/users/password
        [HttpPut("password")]
        [Authorize]
        public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new { error = "User not found" });

            var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
            if (!result.Succeeded)
            {
                var errors = result.Errors.Select(e => e.Description).ToList();
                return BadRequest(new { error = "Failed to change password", details = errors });
            }

            return Ok(new { message = "Password changed successfully" });
        }

        // GET api/users/search?q=thanh&page=1&pageSize=10
        [HttpGet("search")]
        [Authorize] // hoặc policy phù hợp
        public async Task<ActionResult<PagedResult<UserSearchDto>>> Search(
            [FromQuery] string? q,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            IQueryable<ApplicationUser> usersQuery = _userManager.Users;

            if (!string.IsNullOrWhiteSpace(q))
            {
                var normalized = q.Trim().ToUpperInvariant();
                usersQuery = usersQuery.Where(u =>
                    (!string.IsNullOrEmpty(u.NormalizedUserName) && u.NormalizedUserName.Contains(normalized)) ||
                    (!string.IsNullOrEmpty(u.NormalizedEmail) && u.NormalizedEmail.Contains(normalized))
                );
            }

            var total = await usersQuery.CountAsync();

            var users = await usersQuery
                .OrderBy(u => u.UserName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var items = new List<UserSearchDto>();

            foreach (var u in users)
            {
                var roles = await _userManager.GetRolesAsync(u);

                items.Add(new UserSearchDto
                {
                    Id = u.Id,
                    UserName = u.UserName ?? "Unknown",
                    Email = u.Email ?? "Unknown",
                    Avatar = u.Avatar,
                    Roles = roles.ToList()
                });
            }

            var result = new PagedResult<UserSearchDto>
            {
                Items = items,
                Page = page,
                PageSize = pageSize,
                TotalCount = total
            };

            return Ok(result);
        }
        
        [HttpPut("{userId}/role")]
        public async Task<ActionResult> UpdateUserRole(
            string userId,
            [FromBody] UpdateUserRoleDto dto)
        {
            try
            {
                // Lấy current user
                var currentUserId = _userManager.GetUserId(User);
                if (string.IsNullOrEmpty(currentUserId))
                    return Unauthorized();

                var currentUser = await _userManager.FindByIdAsync(currentUserId);
                if (currentUser == null)
                    return Unauthorized();

                // Không thể thay đổi role của chính mình
                if (userId == currentUserId)
                    return BadRequest(new { error = "Cannot change your own role" });

                // Lấy target user
                var targetUser = await _userManager.FindByIdAsync(userId);
                if (targetUser == null)
                    return NotFound(new { error = "User not found" });

                // Validate new role
                if (!RoleHierarchy.IsValidSystemRole(dto.NewRole))
                    return BadRequest(new { error = $"Invalid role: {dto.NewRole}" });

                // Lấy roles hiện tại
                var currentUserRoles = await _userManager.GetRolesAsync(currentUser);
                var targetUserRoles = await _userManager.GetRolesAsync(targetUser);

                // Lấy highest role
                var currentUserHighestRole = GetHighestSystemRole(currentUserRoles);
                var targetUserHighestRole = GetHighestSystemRole(targetUserRoles);

                if (currentUserHighestRole == null)
                    return Forbid("You don't have sufficient permissions");

                // Kiểm tra hierarchy
                var (canAssign, reason) = RoleHierarchy.CanAssignSystemRole(
                    currentUserHighestRole,
                    dto.NewRole);

                if (!canAssign)
                    return Forbid(reason);

                // Kiểm tra target user role
                if (targetUserHighestRole != null &&
                    !RoleHierarchy.IsSystemRoleHigherThan(currentUserHighestRole, targetUserHighestRole))
                {
                    return Forbid($"Cannot modify user with role '{targetUserHighestRole}'. " +
                                $"You can only modify users with lower roles than your role '{currentUserHighestRole}'");
                }

                // Remove all current roles
                if (targetUserRoles.Any())
                {
                    var removeResult = await _userManager.RemoveFromRolesAsync(targetUser, targetUserRoles);
                    if (!removeResult.Succeeded)
                        return BadRequest(new { error = "Failed to remove current roles" });
                }

                // Add new role
                var addResult = await _userManager.AddToRoleAsync(targetUser, dto.NewRole);
                if (!addResult.Succeeded)
                    return BadRequest(new { error = "Failed to add new role" });

                return Ok(new
                {
                    message = "Role updated successfully",
                    userId,
                    newRole = dto.NewRole,
                    previousRole = targetUserHighestRole
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while updating user role" });
            }
        }

        private string? GetHighestSystemRole(IList<string> roles)
        {
            return roles
                .Where(RoleHierarchy.IsValidSystemRole)
                .OrderByDescending(RoleHierarchy.GetSystemRoleRank)
                .FirstOrDefault();
        }

        [HttpDelete("{userId}")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<ActionResult> DeleteUser(string userId)
        {
            var currentUserId = _userManager.GetUserId(User);
            if (userId == currentUserId)
                return BadRequest(new { error = "Cannot delete your own account" });

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new { error = "User not found" });

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
                return BadRequest(new { error = "Failed to delete user", details = result.Errors });

            return Ok(new { message = "User deleted successfully" });
        }
    }
}
