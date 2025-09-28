using AutoMapper;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Notification;
using System.Text.Json;

namespace ProjectManagement.Mappings
{
    public class CreateNotificationDtoToNotificationResolver : IValueResolver<CreateNotificationDto, Notification, string?>
    {
        public string? Resolve(CreateNotificationDto source, Notification destination, string? destMember, ResolutionContext context)
        {
            return source.Data != null ? JsonSerializer.Serialize(source.Data) : null;
        }
    }
}
