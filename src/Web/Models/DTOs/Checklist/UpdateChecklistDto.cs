using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Checklist
{
    public class UpdateChecklistDto
    {
        [MaxLength(200)]
        public string? Title { get; set; }
    }
}