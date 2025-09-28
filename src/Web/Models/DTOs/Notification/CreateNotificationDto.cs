using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Notification
{
    public class CreateNotificationDto
    {
        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public string Type { get; set; } = string.Empty;

        [Required]
        public string Title { get; set; } = string.Empty;

        public string? Message { get; set; }
        public string? ActionUrl { get; set; }
        public Dictionary<string, object>? Data { get; set; }

        public string? BoardId { get; set; }
        public string? CardId { get; set; }
        public string? InviteId { get; set; }
    }
}
