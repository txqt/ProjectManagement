using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Notification
{
    public class BulkNotificationActionDto
    {
        [Required]
        public List<string> NotificationIds { get; set; } = new List<string>();

        [Required]
        public string Action { get; set; } = string.Empty; // "mark_read", "mark_unread", "delete"
    }
}
