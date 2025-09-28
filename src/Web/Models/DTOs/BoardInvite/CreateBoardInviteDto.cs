using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.BoardInvite
{
    public class CreateBoardInviteDto
    {
        [Required]
        [EmailAddress]
        public string InviteeEmail { get; set; } = string.Empty;

        [Required]
        public string Role { get; set; } = "member";

        public string? Message { get; set; }
    }
}
