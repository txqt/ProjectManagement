using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Notification
{
    public class MarkNotificationReadDto
    {
        [Required]
        public string NotificationId { get; set; } = string.Empty;
    }
}
