using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Board
{
    public class UpdateBoardDto
    {
        [MaxLength(200)]
        public string? Title { get; set; }

        public string? Description { get; set; }
        
        public string? Cover { get; set; }

        public string? Type { get; set; }

        public bool AllowShareInviteLink { get; set; } = true;

        public bool AllowCommentsOnCard { get; set; } = true;
        
        public bool AllowAttachmentsOnCard { get; set; } = true;
    }
}
