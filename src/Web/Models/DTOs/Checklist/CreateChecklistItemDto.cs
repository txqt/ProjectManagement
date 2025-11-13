using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Checklist
{
    public class CreateChecklistItemDto
    {
        [Required]
        [MaxLength(500)]
        public string Title { get; set; } = string.Empty;
    }
}