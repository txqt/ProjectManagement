using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Label
{
    public class UpdateLabelDto
    {
        [MaxLength(100)]
        public string? Title { get; set; }

        [MaxLength(20)]
        public string? Color { get; set; }
    }
}