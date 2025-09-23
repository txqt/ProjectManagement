using ProjectManagement.Models.DTOs;
using ProjectManagement.Models.DTOs.Board;
using ProjectManagement.Models.DTOs.Column;
using System.ComponentModel.DataAnnotations;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace ProjectManagement.Models.DTOs.Attachment
{
    public class CreateAttachmentDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Url { get; set; } = string.Empty;

        public string Type { get; set; } = "file";

        // Navigation properties
        public UserDto Owner { get; set; } = null!;
        public List<ColumnDto> Columns { get; set; } = new List<ColumnDto>();
        public List<BoardMemberDto> Members { get; set; } = new List<BoardMemberDto>();
    }
}
