﻿using AutoMapper;
using Infrastructure;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Notification;
using ProjectManagement.Services.Interfaces;
using System.Text.Json;

namespace ProjectManagement.Services
{
    public class NotificationService : INotificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            ApplicationDbContext context,
            IMapper mapper,
            ILogger<NotificationService> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto createNotificationDto)
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid().ToString(),
                UserId = createNotificationDto.UserId,
                Type = createNotificationDto.Type,
                Title = createNotificationDto.Title,
                Message = createNotificationDto.Message,
                ActionUrl = createNotificationDto.ActionUrl,
                Data = createNotificationDto.Data != null ? JsonSerializer.Serialize(createNotificationDto.Data) : null,
                BoardId = createNotificationDto.BoardId,
                CardId = createNotificationDto.CardId,
                InviteId = createNotificationDto.InviteId,
                Created = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created notification {NotificationId} for user {UserId} of type {Type}",
                notification.Id, notification.UserId, notification.Type);

            return _mapper.Map<NotificationDto>(notification);
        }

        public async Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(string userId, int skip = 0, int take = 20, bool? unreadOnly = null)
        {
            var query = _context.Notifications
                .Where(n => n.UserId == userId);

            if (unreadOnly.HasValue && unreadOnly.Value)
            {
                query = query.Where(n => !n.IsRead);
            }

            var notifications = await query
                .OrderByDescending(n => n.Created)
                .Skip(skip)
                .Take(take)
                .Include(n => n.Board)
                .Include(n => n.Card)
                .ToListAsync();

            var dtos = _mapper.Map<IEnumerable<NotificationDto>>(notifications).ToList();

            // Add additional display data
            foreach (var dto in dtos)
            {
                var notification = notifications.First(n => n.Id == dto.Id);
                if (notification.Board != null)
                    dto.BoardTitle = notification.Board.Title;
                if (notification.Card != null)
                    dto.CardTitle = notification.Card.Title;
            }

            return dtos;
        }

        public async Task<NotificationSummaryDto> GetNotificationSummaryAsync(string userId)
        {
            var totalCount = await _context.Notifications
                .CountAsync(n => n.UserId == userId);

            var unreadCount = await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);

            var recentNotifications = await GetUserNotificationsAsync(userId, 0, 5);

            return new NotificationSummaryDto
            {
                TotalCount = totalCount,
                UnreadCount = unreadCount,
                Recent = recentNotifications.ToList()
            };
        }

        public async Task<bool> MarkAsReadAsync(string notificationId, string userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification == null || notification.IsRead)
                return false;

            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> MarkAllAsReadAsync(string userId)
        {
            var unreadNotifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            if (!unreadNotifications.Any())
                return false;

            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteNotificationAsync(string notificationId, string userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification == null)
                return false;

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> BulkActionAsync(BulkNotificationActionDto actionDto, string userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && actionDto.NotificationIds.Contains(n.Id))
                .ToListAsync();

            if (!notifications.Any())
                return 0;

            var now = DateTime.UtcNow;
            var affectedCount = 0;

            switch (actionDto.Action.ToLower())
            {
                case "mark_read":
                    foreach (var notification in notifications.Where(n => !n.IsRead))
                    {
                        notification.IsRead = true;
                        notification.ReadAt = now;
                        affectedCount++;
                    }
                    break;

                case "mark_unread":
                    foreach (var notification in notifications.Where(n => n.IsRead))
                    {
                        notification.IsRead = false;
                        notification.ReadAt = null;
                        affectedCount++;
                    }
                    break;

                case "delete":
                    _context.Notifications.RemoveRange(notifications);
                    affectedCount = notifications.Count;
                    break;

                default:
                    throw new ArgumentException($"Invalid action: {actionDto.Action}");
            }

            if (affectedCount > 0)
            {
                await _context.SaveChangesAsync();
            }

            return affectedCount;
        }

        // Helper methods for creating specific notification types
        public async Task CreateBoardInviteNotificationAsync(string inviteeId, string inviterName, string boardTitle, string inviteId)
        {
            await CreateNotificationAsync(new CreateNotificationDto
            {
                UserId = inviteeId,
                Type = NotificationTypes.BoardInvite,
                Title = "Board Invitation",
                Message = $"{inviterName} has invited you to join the board \"{boardTitle}\"",
                ActionUrl = $"/invites/{inviteId}",
                InviteId = inviteId,
                Data = new Dictionary<string, object>
                {
                    ["inviterName"] = inviterName,
                    ["boardTitle"] = boardTitle,
                    ["inviteId"] = inviteId
                }
            });
        }

        public async Task CreateCardAssignedNotificationAsync(string assigneeId, string assignerName, string cardTitle, string boardTitle, string cardId)
        {
            await CreateNotificationAsync(new CreateNotificationDto
            {
                UserId = assigneeId,
                Type = NotificationTypes.CardAssigned,
                Title = "Card Assignment",
                Message = $"{assignerName} has assigned you to the card \"{cardTitle}\" in \"{boardTitle}\"",
                ActionUrl = $"/cards/{cardId}",
                CardId = cardId,
                Data = new Dictionary<string, object>
                {
                    ["assignerName"] = assignerName,
                    ["cardTitle"] = cardTitle,
                    ["boardTitle"] = boardTitle
                }
            });
        }

        public async Task CreateCommentNotificationAsync(string userId, string commenterName, string cardTitle, string boardTitle, string cardId)
        {
            await CreateNotificationAsync(new CreateNotificationDto
            {
                UserId = userId,
                Type = NotificationTypes.CommentAdded,
                Title = "New Comment",
                Message = $"{commenterName} commented on \"{cardTitle}\" in \"{boardTitle}\"",
                ActionUrl = $"/cards/{cardId}",
                CardId = cardId,
                Data = new Dictionary<string, object>
                {
                    ["commenterName"] = commenterName,
                    ["cardTitle"] = cardTitle,
                    ["boardTitle"] = boardTitle
                }
            });
        }

        public async Task CreateBoardMemberAddedNotificationAsync(string userId, string adderName, string boardTitle, string boardId)
        {
            await CreateNotificationAsync(new CreateNotificationDto
            {
                UserId = userId,
                Type = NotificationTypes.BoardMemberAdded,
                Title = "Added to Board",
                Message = $"{adderName} has added you to the board \"{boardTitle}\"",
                ActionUrl = $"/boards/{boardId}",
                BoardId = boardId,
                Data = new Dictionary<string, object>
                {
                    ["adderName"] = adderName,
                    ["boardTitle"] = boardTitle
                }
            });
        }
    }
}
