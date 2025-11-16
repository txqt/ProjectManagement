using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Board
{
    public class CloneBoardDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        public bool IncludeCards { get; set; } = true;
        public bool IncludeMembers { get; set; } = false;
    }
}