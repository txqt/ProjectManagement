using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Board
{
    public class UpdateMemberRoleDto
    {
        [Required]
        public string Role { get; set; } = string.Empty;
    }
}