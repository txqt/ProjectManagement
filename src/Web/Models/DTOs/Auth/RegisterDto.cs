using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Auth
{
    public class RegisterDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        public string UserName { get; set; } = string.Empty;

        public string? Avatar { get; set; }
    }
}
