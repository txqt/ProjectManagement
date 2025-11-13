using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Checklist
{
    public class CreateChecklistDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
    }
}