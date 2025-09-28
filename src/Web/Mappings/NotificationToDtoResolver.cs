using AutoMapper;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Notification;
using System.Text.Json;

namespace ProjectManagement.Mappings
{
    public class NotificationToDtoResolver : IValueResolver<Notification, NotificationDto, Dictionary<string, object>?>
    {
        public Dictionary<string, object>? Resolve(Notification source, NotificationDto destination, Dictionary<string, object>? destMember, ResolutionContext context)
        {
            if (string.IsNullOrEmpty(source.Data)) return null;
            return JsonSerializer.Deserialize<Dictionary<string, object>>(source.Data);
        }
    }
}
