using Microsoft.AspNetCore.SignalR;
using ProjectManagement.Hubs;
using ProjectManagement.Models.DTOs.Activity;
using ProjectManagement.Models.DTOs.Attachment;
using ProjectManagement.Models.DTOs.BoardJoinRequest;
using ProjectManagement.Models.DTOs.Card;
using ProjectManagement.Models.DTOs.Column;
using ProjectManagement.Models.DTOs.Comment;
using ProjectManagement.Models.DTOs.Notification;
using ProjectManagement.Services.Interfaces;
using ProjectManagement.Models.DTOs.Label;
using ProjectManagement.Models.DTOs.Checklist;

namespace ProjectManagement.Services
{
    public class BoardNotificationService : IBoardNotificationService
    {
        private readonly IHubContext<BoardHub> _hub;
        private readonly BoardPresenceTracker _boardPresenceTracker;
        private readonly ICacheService _cache;
        private readonly ICacheInvalidationService _cacheInvalidation;

        public BoardNotificationService(IHubContext<BoardHub> hub, BoardPresenceTracker boardPresenceTracker,
            ICacheService cache, ICacheInvalidationService cacheInvalidation)
        {
            _hub = hub;
            _boardPresenceTracker = boardPresenceTracker;
            _cache = cache;
            _cacheInvalidation = cacheInvalidation;
        }

        private static string GroupName(string boardId) => $"board-{boardId}";

        private string[] GetExcludedConnectionsForUserInBoard(string boardId, string? userId)
        {
            if (string.IsNullOrEmpty(userId)) return Array.Empty<string>();

            return _boardPresenceTracker.GetConnectionsForBoard(boardId)
                .Where(x => x.User?.Id == userId)
                .Select(x => x.ConnectionId)
                .ToArray();
        }

        public Task BroadcastColumnCreated(string boardId, ColumnDto column, string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                return _hub.Clients.Group(GroupName(boardId)).SendAsync("ColumnCreated", new { column, userId });
            }

            return _hub.Clients.GroupExcept(GroupName(boardId), excluded)
                .SendAsync("ColumnCreated", new { column, userId });
        }

        public Task BroadcastColumnUpdated(string boardId, ColumnDto column, string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                return _hub.Clients.Group(GroupName(boardId)).SendAsync("ColumnUpdated", new { column, userId });
            }

            return _hub.Clients.GroupExcept(GroupName(boardId), excluded)
                .SendAsync("ColumnUpdated", new { column, userId });
        }

        public Task BroadcastColumnDeleted(string boardId, string columnId, string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                return _hub.Clients.Group(GroupName(boardId)).SendAsync("ColumnDeleted", new { columnId, userId });
            }

            return _hub.Clients.GroupExcept(GroupName(boardId), excluded)
                .SendAsync("ColumnDeleted", new { columnId, userId });
        }

        public Task BroadcastCardCreated(string boardId, string columnId, CardDto card, string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                return _hub.Clients.Group(GroupName(boardId)).SendAsync("CardCreated", new { card, columnId, userId });
            }

            return _hub.Clients.GroupExcept(GroupName(boardId), excluded)
                .SendAsync("CardCreated", new { card, columnId, userId });
        }

        public Task BroadcastCardUpdated(string boardId, string columnId, CardDto card, string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                return _hub.Clients.Group(GroupName(boardId)).SendAsync("CardUpdated", new { card, columnId, userId });
            }

            return _hub.Clients.GroupExcept(GroupName(boardId), excluded)
                .SendAsync("CardUpdated", new { card, columnId, userId });
        }

        public Task BroadcastCardDeleted(string boardId, string columnId, string cardId, string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                return _hub.Clients.Group(GroupName(boardId)).SendAsync("CardDeleted", new { cardId, columnId, userId });
            }

            return _hub.Clients.GroupExcept(GroupName(boardId), excluded)
                .SendAsync("CardDeleted", new { cardId, columnId, userId });
        }

        public async Task BroadcastCardsReordered(string boardId, string columnId, List<string> cardIds,
            List<CardDto> orderedCards, string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                await _hub.Clients
                    .Group(GroupName(boardId))
                    .SendAsync("CardsReordered", new
                    {
                        boardId,
                        columnId,
                        cardIds,
                        orderedCards,
                        userId
                    });
            }
            else
            {
                await _hub.Clients
                    .GroupExcept(GroupName(boardId), excluded)
                    .SendAsync("CardsReordered", new
                    {
                        boardId,
                        columnId,
                        cardIds,
                        orderedCards,
                        userId
                    });
            }
        }

        public async Task BroadcastColumnsReordered(string boardId, List<string> columnIds,
            List<ColumnDto> orderedColumns, string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                await _hub.Clients
                    .Group(GroupName(boardId))
                    .SendAsync("ColumnsReordered", new { boardId, columnIds, orderedColumns, userId });
            }
            else
            {
                await _hub.Clients
                    .GroupExcept(GroupName(boardId), excluded)
                    .SendAsync("ColumnsReordered", new { boardId, columnIds, orderedColumns, userId });
            }
        }

        public Task BroadcastCardMoved(string boardId, string fromColumnId, string toColumnId, string cardId,
            int newIndex, string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                return _hub.Clients.Group(GroupName(boardId))
                    .SendAsync("CardMoved", new
                    {
                        cardId,
                        fromColumnId,
                        toColumnId,
                        newIndex,
                        userId
                    });
            }

            return _hub.Clients.GroupExcept(GroupName(boardId), excluded)
                .SendAsync("CardMoved", new
                {
                    cardId,
                    fromColumnId,
                    toColumnId,
                    newIndex,
                    userId
                });
        }

        public async Task SendNotificationToUser(string userId, NotificationDto notification)
        {
            await _hub.Clients.User(userId).SendAsync("NotificationReceived", notification);
        }

        public async Task BroadcastNotificationRead(string userId, string notificationId)
        {
            await _hub.Clients.User(userId).SendAsync("NotificationRead", new { notificationId });
        }

        public async Task BroadcastNotificationDeleted(string userId, string notificationId)
        {
            await _hub.Clients.User(userId).SendAsync("NotificationDeleted", new { notificationId });
        }

        public Task BroadcastCardAssigned(string boardId, string columnId, CardDto cardDto, string assignedUserId,
            string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                return _hub.Clients.Group(GroupName(boardId))
                    .SendAsync("CardAssigned", new { card = cardDto, columnId, assignedUserId, userId });
            }

            return _hub.Clients.GroupExcept(GroupName(boardId), excluded)
                .SendAsync("CardAssigned", new { card = cardDto, columnId, assignedUserId, userId });
        }

        public Task BroadcastCardUnassigned(string boardId, string columnId, CardDto cardDto, string unassignedUserId,
            string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                return _hub.Clients.Group(GroupName(boardId))
                    .SendAsync("CardUnassigned", new { card = cardDto, columnId, unassignedUserId, userId });
            }

            return _hub.Clients.GroupExcept(GroupName(boardId), excluded)
                .SendAsync("CardUnassigned", new { card = cardDto, columnId, unassignedUserId, userId });
        }

        // Comment events
        public async Task BroadcastCommentAdded(string boardId, string columnId, string cardId, CommentDto comment,
            string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                await _hub.Clients
                    .Group(GroupName(boardId))
                    .SendAsync("CommentAdded", new
                    {
                        boardId,
                        columnId,
                        cardId,
                        comment,
                        userId
                    });
            }
            else
            {
                await _hub.Clients
                    .GroupExcept(GroupName(boardId), excluded)
                    .SendAsync("CommentAdded", new
                    {
                        boardId,
                        columnId,
                        cardId,
                        comment,
                        userId
                    });
            }
        }

        public async Task BroadcastCommentUpdated(string boardId, string columnId, string cardId, CommentDto comment,
            string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                await _hub.Clients
                    .Group(GroupName(boardId))
                    .SendAsync("CommentUpdated", new
                    {
                        boardId,
                        columnId,
                        cardId,
                        comment,
                        userId
                    });
            }
            else
            {
                await _hub.Clients
                    .GroupExcept(GroupName(boardId), excluded)
                    .SendAsync("CommentUpdated", new
                    {
                        boardId,
                        columnId,
                        cardId,
                        comment,
                        userId
                    });
            }
        }

        public async Task BroadcastCommentDeleted(string boardId, string columnId, string cardId, string commentId,
            string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                await _hub.Clients
                    .Group(GroupName(boardId))
                    .SendAsync("CommentDeleted", new
                    {
                        boardId,
                        columnId,
                        cardId,
                        commentId,
                        userId
                    });
            }
            else
            {
                await _hub.Clients
                    .GroupExcept(GroupName(boardId), excluded)
                    .SendAsync("CommentDeleted", new
                    {
                        boardId,
                        columnId,
                        cardId,
                        commentId,
                        userId
                    });
            }
        }

        // Attachment events
        public async Task BroadcastAttachmentAdded(string boardId, string columnId, string cardId,
            AttachmentDto attachment, string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                await _hub.Clients
                    .Group(GroupName(boardId))
                    .SendAsync("AttachmentAdded", new
                    {
                        boardId,
                        columnId,
                        cardId,
                        attachment,
                        userId
                    });
            }
            else
            {
                await _hub.Clients
                    .GroupExcept(GroupName(boardId), excluded)
                    .SendAsync("AttachmentAdded", new
                    {
                        boardId,
                        columnId,
                        cardId,
                        attachment,
                        userId
                    });
            }
        }

        public async Task BroadcastAttachmentDeleted(string boardId, string columnId, string cardId,
            string attachmentId, string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                await _hub.Clients
                    .Group(GroupName(boardId))
                    .SendAsync("AttachmentDeleted", new
                    {
                        boardId,
                        columnId,
                        cardId,
                        attachmentId,
                        userId
                    });
            }
            else
            {
                await _hub.Clients
                    .GroupExcept(GroupName(boardId), excluded)
                    .SendAsync("AttachmentDeleted", new
                    {
                        boardId,
                        columnId,
                        cardId,
                        attachmentId,
                        userId
                    });
            }
        }

        public async Task BroadcastJoinRequestCreated(string boardId, BoardJoinRequestDto request)
        {
            await _cacheInvalidation.InvalidateJoinRequestsCacheAsync(boardId);

            await _hub.Clients
                .Group(GroupName(boardId))
                .SendAsync("JoinRequestCreated", new { boardId, request });
        }

        public async Task BroadcastJoinRequestResponded(string boardId, string requestId, string status, string userId)
        {
            await _hub.Clients
                .Group(GroupName(boardId))
                .SendAsync("JoinRequestResponded", new { boardId, requestId, status, userId });

            // Also send to specific user
            await _hub.Clients
                .User(userId)
                .SendAsync("JoinRequestResponded", new { boardId, requestId, status });
        }

        public async Task BroadcastActivityLogged(string boardId, ActivityLogDto activityLogDto)
        {
            await _hub.Clients
                .Group($"board-{activityLogDto.BoardId}")
                .SendAsync("ActivityLogged", new { boardId = activityLogDto.BoardId, activity = activityLogDto });
        }

        // Label implementations
        public Task BroadcastLabelCreated(string boardId, LabelDto label, string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                return _hub.Clients.Group(GroupName(boardId)).SendAsync("LabelCreated", new { boardId, label, userId });
            }

            return _hub.Clients.GroupExcept(GroupName(boardId), excluded)
                .SendAsync("LabelCreated", new { boardId, label, userId });
        }

        public Task BroadcastLabelUpdated(string boardId, LabelDto label, string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                return _hub.Clients.Group(GroupName(boardId)).SendAsync("LabelUpdated", new { boardId, label, userId });
            }

            return _hub.Clients.GroupExcept(GroupName(boardId), excluded)
                .SendAsync("LabelUpdated", new { boardId, label, userId });
        }

        public Task BroadcastLabelDeleted(string boardId, string labelId, string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                return _hub.Clients.Group(GroupName(boardId)).SendAsync("LabelDeleted", new { boardId, labelId, userId });
            }

            return _hub.Clients.GroupExcept(GroupName(boardId), excluded)
                .SendAsync("LabelDeleted", new { boardId, labelId, userId });
        }

        public Task BroadcastCardLabelAdded(string boardId, string columnId, string cardId, string labelId,
            string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                return _hub.Clients.Group(GroupName(boardId)).SendAsync("CardLabelAdded", new
                {
                    boardId,
                    columnId,
                    cardId,
                    labelId,
                    userId
                });
            }

            return _hub.Clients.GroupExcept(GroupName(boardId), excluded)
                .SendAsync("CardLabelAdded", new
                {
                    boardId,
                    columnId,
                    cardId,
                    labelId,
                    userId
                });
        }

        public Task BroadcastCardLabelRemoved(string boardId, string columnId, string cardId, string labelId,
            string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                return _hub.Clients.Group(GroupName(boardId))
                    .SendAsync("CardLabelRemoved", new
                    {
                        boardId,
                        columnId,
                        cardId,
                        labelId,
                        userId
                    });
            }

            return _hub.Clients.GroupExcept(GroupName(boardId), excluded)
                .SendAsync("CardLabelRemoved", new
                {
                    boardId,
                    columnId,
                    cardId,
                    labelId,
                    userId
                });
        }

        // Checklist implementations
        public Task BroadcastChecklistCreated(string boardId, string columnId, string cardId, ChecklistDto checklist,
            string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                return _hub.Clients.Group(GroupName(boardId))
                    .SendAsync("ChecklistCreated", new
                    {
                        boardId,
                        columnId,
                        cardId,
                        checklist,
                        userId
                    });
            }

            return _hub.Clients.GroupExcept(GroupName(boardId), excluded)
                .SendAsync("ChecklistCreated", new
                {
                    boardId,
                    columnId,
                    cardId,
                    checklist,
                    userId
                });
        }

        public Task BroadcastChecklistUpdated(string boardId, string columnId, string cardId, ChecklistDto checklist,
            string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                return _hub.Clients.Group(GroupName(boardId))
                    .SendAsync("ChecklistUpdated", new
                    {
                        boardId,
                        columnId,
                        cardId,
                        checklist,
                        userId
                    });
            }

            return _hub.Clients.GroupExcept(GroupName(boardId), excluded)
                .SendAsync("ChecklistUpdated", new
                {
                    boardId,
                    columnId,
                    cardId,
                    checklist,
                    userId
                });
        }

        public Task BroadcastChecklistDeleted(string boardId, string columnId, string cardId, string checklistId,
            string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                return _hub.Clients.Group(GroupName(boardId)).SendAsync("ChecklistDeleted",
                    new
                    {
                        boardId,
                        columnId,
                        cardId,
                        checklistId,
                        userId
                    });
            }

            return _hub.Clients.GroupExcept(GroupName(boardId), excluded)
                .SendAsync("ChecklistDeleted",
                    new
                    {
                        boardId,
                        columnId,
                        cardId,
                        checklistId,
                        userId
                    });
        }

        public Task BroadcastChecklistItemCreated(string boardId, string columnId, string cardId, string checklistId,
            ChecklistItemDto item, string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                return _hub.Clients.Group(GroupName(boardId)).SendAsync("ChecklistItemCreated",
                    new
                    {
                        boardId,
                        columnId,
                        cardId,
                        checklistId,
                        item,
                        userId
                    });
            }

            return _hub.Clients.GroupExcept(GroupName(boardId), excluded)
                .SendAsync("ChecklistItemCreated",
                    new
                    {
                        boardId,
                        columnId,
                        cardId,
                        checklistId,
                        item,
                        userId
                    });
        }

        public Task BroadcastChecklistItemUpdated(string boardId, string columnId, string cardId, string checklistId,
            ChecklistItemDto item, string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                return _hub.Clients.Group(GroupName(boardId)).SendAsync("ChecklistItemUpdated",
                    new
                    {
                        boardId,
                        columnId,
                        cardId,
                        checklistId,
                        item,
                        userId
                    });
            }

            return _hub.Clients.GroupExcept(GroupName(boardId), excluded)
                .SendAsync("ChecklistItemUpdated",
                    new
                    {
                        boardId,
                        columnId,
                        cardId,
                        checklistId,
                        item,
                        userId
                    });
        }

        public Task BroadcastChecklistItemToggled(string boardId, string columnId, string cardId, string checklistId,
            ChecklistItemDto checklistItemDto, string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                return _hub.Clients.Group(GroupName(boardId)).SendAsync("ChecklistItemToggled",
                    new
                    {
                        boardId,
                        columnId,
                        cardId,
                        checklistId,
                        checklistItemDto,
                        userId
                    });
            }

            return _hub.Clients.GroupExcept(GroupName(boardId), excluded)
                .SendAsync("ChecklistItemToggled",
                    new
                    {
                        boardId,
                        columnId,
                        cardId,
                        checklistId,
                        checklistItemDto,
                        userId
                    });
        }

        public Task BroadcastChecklistItemDeleted(string boardId, string columnId, string cardId, string checklistId,
            string itemId, string userId)
        {
            var excluded = GetExcludedConnectionsForUserInBoard(boardId, userId);
            if (excluded.Length == 0)
            {
                return _hub.Clients.Group(GroupName(boardId)).SendAsync("ChecklistItemDeleted",
                    new
                    {
                        boardId,
                        columnId,
                        cardId,
                        checklistId,
                        itemId,
                        userId
                    });
            }

            return _hub.Clients.GroupExcept(GroupName(boardId), excluded)
                .SendAsync("ChecklistItemDeleted",
                    new
                    {
                        boardId,
                        columnId,
                        cardId,
                        checklistId,
                        itemId,
                        userId
                    });
        }
    }
}