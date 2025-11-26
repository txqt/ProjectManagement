using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Attributes;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs;
using ProjectManagement.Models.DTOs.Auth;
using ProjectManagement.Services;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [RateLimit(RequestsPerMinute = 30, RequestsPerHour = 100)]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ITokenService _tokenService;
        private readonly IMapper _mapper;
        private readonly ITempTokenService _tempTokenService;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ITokenService tokenService,
            IMapper mapper, ITempTokenService tempTokenService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
            _mapper = mapper;
            _tempTokenService = tempTokenService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto registerDto)
        {
            var user = new ApplicationUser
            {
                UserName = registerDto.UserName,
                Email = registerDto.Email,
                Avatar = registerDto.Avatar,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);

            if (!result.Succeeded)
            {
                return BadRequest(string.Join("\n", result.Errors.Select(e => e.Description)));
            }

            // Add default role
            await _userManager.AddToRoleAsync(user, "User");

            var token = await _tokenService.GenerateTokenAsync(user);

            var response = new AuthResponseDto
            {
                Token = token, Expires = DateTime.UtcNow.AddDays(7), User = _mapper.Map<UserDto>(user)
            };

            return Ok(response);
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
        {
            var user = await _userManager.FindByEmailAsync(loginDto.Email);

            if (user == null)
            {
                return Unauthorized("Invalid credentials");
            }

            if (!await _userManager.IsEmailConfirmedAsync(user))
            {
                return Unauthorized(new
                {
                    message = "Email not confirmed. Please check your email.", requiresEmailConfirmation = true
                });
            }

            if (await _userManager.IsLockedOutAsync(user))
            {
                var lockoutEnd = await _userManager.GetLockoutEndDateAsync(user);
                if (lockoutEnd.HasValue)
                {
                    var minutesRemaining = (int)(lockoutEnd.Value - DateTimeOffset.UtcNow).TotalMinutes;

                    return Unauthorized(new
                    {
                        message = $"Account locked. Try again in {minutesRemaining} minutes.",
                        lockedUntil = lockoutEnd.Value,
                        isLockedOut = true
                    });
                }
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, lockoutOnFailure: true);

            if (!result.Succeeded)
            {
                if (result.IsLockedOut)
                {
                    var lockoutEnd = await _userManager.GetLockoutEndDateAsync(user);
                    return Unauthorized(new
                    {
                        message = "Account locked. Too many failed attempts.",
                        lockedUntil = lockoutEnd,
                        isLockedOut = true
                    });
                }

                // Get failed attempts count
                var failedAttempts = await _userManager.GetAccessFailedCountAsync(user);
                var maxAttempts = _userManager.Options.Lockout.MaxFailedAccessAttempts;
                var remainingAttempts = maxAttempts - failedAttempts;

                return Unauthorized(new
                {
                    message = $"Invalid credentials ({failedAttempts}/{maxAttempts} attempts used)",
                    remainingAttempts = remainingAttempts > 0 ? remainingAttempts : 0,
                    failedAttempts = failedAttempts
                });
            }

            // Reset failed attempts on successful password
            await _userManager.ResetAccessFailedCountAsync(user);

            // CHECK IF 2FA IS ENABLED
            if (await _userManager.GetTwoFactorEnabledAsync(user))
            {
                var tempToken = _tempTokenService.GenerateTempToken(user.Id);

                return Ok(new
                {
                    requiresTwoFactor = true, tempToken = tempToken, expiresIn = 300 // 5 minutes
                });
            }

            // Normal login flow - generate JWT token
            var token = await _tokenService.GenerateTokenAsync(user);
            return Ok(new { token, user = new { user.Email, user.UserName } });
        }
        
        [HttpPost("verify-2fa")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyTwoFactor([FromBody] TwoFactorLoginDto model)
        {
            // Validate temp token
            var userId = _tempTokenService.ValidateTempToken(model.TempToken);
    
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Invalid or expired temporary token. Please login again." });
            }
    
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return Unauthorized(new { message = "User not found" });
            }
            // Verify TOTP code
            var isValid = await _userManager.VerifyTwoFactorTokenAsync(
                user,
                _userManager.Options.Tokens.AuthenticatorTokenProvider,
                model.Code
            );
    
            if (!isValid)
            {
                // Try recovery code as fallback
                var recoveryResult = await _userManager.RedeemTwoFactorRecoveryCodeAsync(user, model.Code);
                if (!recoveryResult.Succeeded)
                {
                    return Unauthorized(new { message = "Invalid 2FA code or recovery code" });
                }
            }
    
            // FIXED: Reset access failed count after successful 2FA
            await _userManager.ResetAccessFailedCountAsync(user);
    
            // Generate real JWT token
            var token = await _tokenService.GenerateTokenAsync(user);
    
            return Ok(new { token, user = new { user.Email, user.UserName } });
        }
    }
}