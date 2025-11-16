using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Column
{
    public class CloneColumnDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        public bool IncludeCards { get; set; } = true;
    }
}