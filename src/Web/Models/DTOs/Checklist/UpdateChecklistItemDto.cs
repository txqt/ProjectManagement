using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Checklist
{
    public class UpdateChecklistItemDto
    {
        [MaxLength(500)]
        public string? Title { get; set; }

        public bool? IsCompleted { get; set; }
    }
}