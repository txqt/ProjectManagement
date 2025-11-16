using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Card
{
    public class CloneCardDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        public bool IncludeMembers { get; set; } = false;
        public bool IncludeComments { get; set; } = false;
        public bool IncludeAttachments { get; set; } = false;
        public bool IncludeChecklists { get; set; } = true;
        public bool IncludeLabels { get; set; } = true;
    }
}