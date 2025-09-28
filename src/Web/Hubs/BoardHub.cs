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
            // Nếu bạn muốn lưu user info theo connection (nếu token có claim)
            var userId = Context.User?.FindFirst("sub")?.Value ?? Context.UserIdentifier ?? Context.ConnectionId;
            var displayName = Context.User?.Identity?.Name ?? userId;

            _presence.SetUserForConnection(Context.ConnectionId, new UserDto(userId, displayName));

            return base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            // Khi mất kết nối: lấy các boards đã join, emit UserLeft cho từng group nếu cần
            var boards = _presence.GetBoardsForConnection(Context.ConnectionId).ToArray();
            if (boards.Any())
            {
                if (_presence.TryRemoveUserForConnection(Context.ConnectionId, out var user))
                {
                    foreach (var boardId in boards)
                    {
                        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(boardId));
                        await Clients.Group(GroupName(boardId)).SendAsync("UserLeft", new { user });
                    }
                }
            }

            // chắc chắn xóa mapping connection->boards
            foreach (var boardId in boards)
            {
                _presence.RemoveConnectionFromBoard(Context.ConnectionId, boardId);
            }

            await base.OnDisconnectedAsync(exception);
        }

        // Client gọi để join group của board
        public async Task JoinBoard(string boardId)
        {
            if (string.IsNullOrWhiteSpace(boardId)) return;

            await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(boardId));
            _presence.AddConnectionToBoard(Context.ConnectionId, boardId);

            // Phát thông báo user joined to group
            if (_presence.TryRemoveUserForConnection(Context.ConnectionId, out var tmpUser))
            {
                // note: TryRemoveUserForConnection vừa lấy user ra, ta cần backup rồi set lại
                _presence.SetUserForConnection(Context.ConnectionId, tmpUser);
            }

            var user = _presence.GetAllConnections().FirstOrDefault(x => x.ConnectionId == Context.ConnectionId).User;
            await Clients.Group(GroupName(boardId)).SendAsync("UserJoined", new { user });
        }

        public async Task LeaveBoard(string boardId)
        {
            if (string.IsNullOrWhiteSpace(boardId)) return;

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(boardId));
            _presence.RemoveConnectionFromBoard(Context.ConnectionId, boardId);

            var user = _presence.GetAllConnections().FirstOrDefault(x => x.ConnectionId == Context.ConnectionId).User;
            await Clients.Group(GroupName(boardId)).SendAsync("UserLeft", new { user });
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
