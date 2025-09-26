using Microsoft.AspNetCore.SignalR;
using ProjectManagement.Hubs;
using ProjectManagement.Models.DTOs.Card;
using ProjectManagement.Models.DTOs.Column;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Services
{
    public class BoardNotificationService : IBoardNotificationService
    {
        private readonly IHubContext<BoardHub> _hub;

        public BoardNotificationService(IHubContext<BoardHub> hub)
        {
            _hub = hub;
        }

        private static string GroupName(string boardId) => $"board-{boardId}";

        public Task BroadcastColumnCreated(string boardId, ColumnDto column, string userId) =>
            _hub.Clients.Group(GroupName(boardId)).SendAsync("ColumnCreated", new { column, userId });

        public Task BroadcastColumnUpdated(string boardId, ColumnDto column, string userId) =>
            _hub.Clients.Group(GroupName(boardId)).SendAsync("ColumnUpdated", new { column, userId });

        public Task BroadcastColumnDeleted(string boardId, string columnId, string userId) =>
            _hub.Clients.Group(GroupName(boardId)).SendAsync("ColumnDeleted", new { columnId, userId });

        public Task BroadcastCardCreated(string boardId, string columnId, CardDto card, string userId) =>
            _hub.Clients.Group(GroupName(boardId)).SendAsync("CardCreated", new { card, columnId, userId });

        public Task BroadcastCardUpdated(string boardId, string columnId, CardDto card, string userId) =>
            _hub.Clients.Group(GroupName(boardId)).SendAsync("CardUpdated", new { card, columnId, userId });

        public Task BroadcastCardDeleted(string boardId, string columnId, string cardId, string userId) =>
            _hub.Clients.Group(GroupName(boardId)).SendAsync("CardDeleted", new { cardId, columnId, userId });

        public Task BroadcastCardsReordered(string boardId, string columnId, IEnumerable<string> cardOrderIds, string userId) =>
            _hub.Clients.Group(GroupName(boardId)).SendAsync("CardsReordered", new { columnId, cardOrderIds, userId });

        public Task BroadcastColumnsReordered(string boardId, IEnumerable<string> columnOrderIds, string userId) =>
            _hub.Clients.Group(GroupName(boardId)).SendAsync("ColumnsReordered", new { columnOrderIds, userId });

        public Task BroadcastCardMoved(string boardId, string fromColumnId, string toColumnId, string cardId, int newIndex, string userId) =>
            _hub.Clients.Group(GroupName(boardId)).SendAsync("CardMoved", new { cardId, fromColumnId, toColumnId, newIndex, userId });
    }
}
