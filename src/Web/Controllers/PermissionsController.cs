using ProjectManagement.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Attributes;
using ProjectManagement.Authorization;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Permission;
using ProjectManagement.Services.Interfaces;
using PermissionRequirement = ProjectManagement.Authorization.PermissionRequirement;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PermissionsController : ControllerBase
    {
        private readonly IPermissionService _permissionService;
        private readonly IAuthorizationService _authorizationService;
        private readonly UserManager<ApplicationUser> _userManager;

        public PermissionsController(IPermissionService permissionService, IAuthorizationService authorizationService,
            UserManager<ApplicationUser> userManager)
        {
            _permissionService = permissionService;
            _authorizationService = authorizationService;
            _userManager = userManager;
        }

        [HttpGet("my-permissions")]
        public async Task<ActionResult<UserPermissionsDto>> GetMyPermissions()
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var result = new UserPermissionsDto
            {
                UserId = userId,
                SystemPermissions = await _permissionService.GetUserSystemPermissionsAsync(userId),
                BoardPermissions = await _permissionService.GetUserBoardPermissionsAsync(userId)
            };

            return Ok(result);
        }

        [HttpPost("check-board-permission")]
        public async Task<ActionResult<PermissionCheckResultDto>> CheckBoardPermission(
            [FromBody] BoardPermissionCheckDto request)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var res = await _permissionService.CheckBoardPermissionAsync(userId, request.BoardId, request.Permission);
            return Ok(new PermissionCheckResultDto { HasPermission = res.HasPermission, Reason = res.Reason });
        }

        // Example: use IAuthorizationService so controller's check uses same handler
        [HttpGet("boards/{boardId}/can-move-card")]
        public async Task<IActionResult> CanMoveCard(string boardId)
        {
            var authResult = await _authorizationService.AuthorizeAsync(User, boardId,
                new PermissionRequirement(Permissions.Cards.Move, boardId));
            return Ok(new { canMove = authResult.Succeeded });
        }
    }
}