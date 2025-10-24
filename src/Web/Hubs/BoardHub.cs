using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using ProjectManagement.Models.DTOs;
using ProjectManagement.Models.DTOs.Board;
using ProjectManagement.Models.DTOs.Card;
using ProjectManagement.Models.DTOs.Column;
using ProjectManagement.Services;
using System.Collections.Concurrent;
using System.Text.RegularExpressions;

namespace ProjectManagement.Hubs
{
    [Authorize] // nếu cần authentication
    public class BoardHub : Hub
    {
        private readonly BoardPresenceTracker _presence;

        public BoardHub(BoardPresenceTracker presence)
        {
            _presence = presence;
        }

        private static string GroupName(string boardId) => $"board-{boardId}";

        public override Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                         ?? Context.User?.FindFirst("sub")?.Value
                         ?? Context.UserIdentifier;
            var userName = Context.User?.Identity?.Name ?? userId;

            _presence.SetUserForConnection(Context.ConnectionId, new UserDto(userId, userName));

            return base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var boards = _presence.GetBoardsForConnection(Context.ConnectionId).ToArray();

            // Lấy user (không xóa ngay)
            if (_presence.TryGetUserForConnection(Context.ConnectionId, out var user))
            {
                foreach (var boardId in boards)
                {
                    // Remove khỏi group
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(boardId));

                    // Nếu không còn connection khác của cùng user trong board -> broadcast UserLeft
                    var hasOther = _presence.HasOtherConnectionsInBoard(user.Id, boardId, Context.ConnectionId);
                    if (!hasOther)
                    {
                        await Clients.Group(GroupName(boardId)).SendAsync("UserLeft", new { boardId, user });
                    }
                }

                // Sau khi đã broadcast (hoặc không), xóa mapping user->connection
                _presence.TryRemoveUserForConnection(Context.ConnectionId, out _);
            }

            // Xóa connection->boards mapping
            foreach (var boardId in boards)
            {
                _presence.RemoveConnectionFromBoard(Context.ConnectionId, boardId);
            }

            await base.OnDisconnectedAsync(exception);
        }

        public async Task JoinBoard(string boardId)
        {
            if (string.IsNullOrWhiteSpace(boardId)) return;

            await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(boardId));
            _presence.AddConnectionToBoard(Context.ConnectionId, boardId);

            // Lấy user hiện tại cho connection này
            if (!_presence.TryGetUserForConnection(Context.ConnectionId, out var user))
            {
                // fallback (hiếm khi xảy ra)
                var userId = Context.UserIdentifier ?? "unknown";
                var userName = Context.User?.Identity?.Name ?? userId;
                user = new UserDto(userId, userName);
                _presence.SetUserForConnection(Context.ConnectionId, user);
            }

            // Nếu đây là lần đầu user xuất hiện trong board (không có connection khác) -> broadcast UserJoined
            var alreadyPresent = _presence.HasOtherConnectionsInBoard(user.Id, boardId, Context.ConnectionId);
            if (!alreadyPresent)
            {
                await Clients.Group(GroupName(boardId)).SendAsync("UserJoined", new { boardId, user });
            }
        }

        public async Task LeaveBoard(string boardId)
        {
            if (string.IsNullOrWhiteSpace(boardId)) return;

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(boardId));
            _presence.RemoveConnectionFromBoard(Context.ConnectionId, boardId);

            if (_presence.TryGetUserForConnection(Context.ConnectionId, out var user))
            {
                var hasOther = _presence.HasOtherConnectionsInBoard(user.Id, boardId, Context.ConnectionId);
                if (!hasOther)
                {
                    await Clients.Group(GroupName(boardId)).SendAsync("UserLeft", new { boardId, user });
                }
            }
        }

        public Task<List<UserDto>> GetUsersInBoard(string boardId)
        {
            if (string.IsNullOrWhiteSpace(boardId))
                return Task.FromResult(new List<UserDto>());

            var users = _presence.GetUsersInBoard(boardId).ToList();
            return Task.FromResult(users);
        }

        // Lưu ý: không bắt buộc phải có các phương thức create/update/delete ở Hub.
        // Thường backend sẽ thực hiện action qua HTTP API (vì cần lưu DB) rồi dùng IHubContext để broadcast.
        // Tuy nhiên nếu bạn muốn client gọi trực tiếp hub để thực hiện action, triển khai thêm ở đây.
    }
}