using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Models.Domain.Entities;
using System.Security.Claims;

namespace ProjectManagement.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TwoFactorController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<TwoFactorController> _logger;

        public TwoFactorController(
            UserManager<ApplicationUser> userManager,
            ILogger<TwoFactorController> logger)
        {
            _userManager = userManager;
            _logger = logger;
        }

        [HttpPost("enable")]
        public async Task<IActionResult> Enable()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId);
            
            if (user == null)
                return NotFound(new { message = "User not found" });

            // Reset authenticator key (generates new secret)
            await _userManager.ResetAuthenticatorKeyAsync(user);
            
            var key = await _userManager.GetAuthenticatorKeyAsync(user);
            
            // Generate QR code URL for authenticator apps
            var email = await _userManager.GetEmailAsync(user);
            var authenticatorUri = $"otpauth://totp/ProjectManagement:{Uri.EscapeDataString(email)}?secret={key}&issuer=ProjectManagement&digits=6";
            
            _logger.LogInformation("User {UserId} initiated 2FA setup", userId);
            
            return Ok(new
            {
                sharedKey = key,
                authenticatorUri = authenticatorUri
            });
        }

        [HttpPost("verify")]
        public async Task<IActionResult> Verify([FromBody] VerifyCodeDto model)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId);
            
            if (user == null)
                return NotFound(new { message = "User not found" });

            // Verify the TOTP code
            var isValid = await _userManager.VerifyTwoFactorTokenAsync(
                user, 
                _userManager.Options.Tokens.AuthenticatorTokenProvider, 
                model.Code
            );
            
            if (!isValid)
            {
                _logger.LogWarning("Invalid 2FA verification code for user {UserId}", userId);
                return BadRequest(new { message = "Invalid verification code" });
            }
            
            // Enable 2FA for the user
            await _userManager.SetTwoFactorEnabledAsync(user, true);
            
            // Generate recovery codes
            var recoveryCodes = await _userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10);
            
            _logger.LogInformation("User {UserId} successfully enabled 2FA", userId);
            
            return Ok(new
            {
                success = true,
                recoveryCodes = recoveryCodes
            });
        }

        [HttpPost("disable")]
        public async Task<IActionResult> Disable()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId);
            
            if (user == null)
                return NotFound(new { message = "User not found" });

            await _userManager.SetTwoFactorEnabledAsync(user, false);
            await _userManager.ResetAuthenticatorKeyAsync(user);
            
            _logger.LogInformation("User {UserId} disabled 2FA", userId);
            
            return Ok(new { success = true, message = "Two-factor authentication has been disabled" });
        }

        [HttpPost("recovery-codes")]
        public async Task<IActionResult> GenerateRecoveryCodes()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId);
            
            if (user == null)
                return NotFound(new { message = "User not found" });

            if (!await _userManager.GetTwoFactorEnabledAsync(user))
            {
                return BadRequest(new { message = "Two-factor authentication is not enabled" });
            }

            var recoveryCodes = await _userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10);
            
            _logger.LogInformation("User {UserId} generated new recovery codes", userId);
            
            return Ok(new { recoveryCodes });
        }

        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId);
            
            if (user == null)
                return NotFound(new { message = "User not found" });

            var isTwoFactorEnabled = await _userManager.GetTwoFactorEnabledAsync(user);
            var recoveryCodesLeft = await _userManager.CountRecoveryCodesAsync(user);
            
            return Ok(new
            {
                isTwoFactorEnabled = isTwoFactorEnabled,
                recoveryCodesLeft = recoveryCodesLeft
            });
        }
    }

    public class VerifyCodeDto
    {
        public string Code { get; set; }
    }
}
