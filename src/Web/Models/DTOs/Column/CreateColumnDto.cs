using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Column
{
    public class CreateColumnDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
    }
}
