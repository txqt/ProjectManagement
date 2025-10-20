using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Board
{
    public class TransferOwnershipDto
    {
        [Required]
        public string NewOwnerId { get; set; } = string.Empty;
    }
}