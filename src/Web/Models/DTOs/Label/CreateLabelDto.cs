using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Label
{
    public class CreateLabelDto
    {
        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Color { get; set; } = "#808080";
    }
}