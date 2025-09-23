using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Board
{
    public class AddBoardMemberDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        public string Role { get; set; } = "member";
    }
}
