using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.BoardInvite
{
    public class RespondToInviteDto
    {
        [Required]
        public string Response { get; set; } = string.Empty; // "accept" or "decline"
    }
}
