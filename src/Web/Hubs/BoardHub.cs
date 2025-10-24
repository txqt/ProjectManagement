using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using ProjectManagement.Authorization;
using ProjectManagement.Models.DTOs;
using ProjectManagement.Models.DTOs.Board;
using ProjectManagement.Models.DTOs.Card;
using ProjectManagement.Models.DTOs.Column;
using ProjectManagement.Services;
using ProjectManagement.Services.Interfaces;
using System.Collections.Concurrent;
using System.Text.RegularExpressions;

namespace ProjectManagement.Hubs
{
    [Authorize] // nếu cần authentication
    public class BoardHub : Hub
    {
        private readonly BoardPresenceTracker _presence;
        private readonly IPermissionService _permissionService;

        public BoardHub(BoardPresenceTracker presence, IPermissionService permissionService)
        {
            _presence = presence;
            _permissionService = permissionService;
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

            if (_presence.TryGetUserForConnection(Context.ConnectionId, out var user))
            {
                foreach (var boardId in boards)
                {
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(boardId));

                    var hasOther = _presence.HasOtherConnectionsInBoard(user.Id, boardId, Context.ConnectionId);
                    if (!hasOther)
                    {
                        await Clients.Group(GroupName(boardId)).SendAsync("UserLeft", new { boardId, user });
                    }
                }

                _presence.TryRemoveUserForConnection(Context.ConnectionId, out _);
            }

            foreach (var boardId in boards)
            {
                _presence.RemoveConnectionFromBoard(Context.ConnectionId, boardId);
            }

            await base.OnDisconnectedAsync(exception);
        }

        public async Task JoinBoard(string boardId)
        {
            if (string.IsNullOrWhiteSpace(boardId)) return;

            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                         ?? Context.User?.FindFirst("sub")?.Value
                         ?? Context.UserIdentifier
                         ?? "unknown";
            var userName = Context.User?.Identity?.Name ?? userId;

            // 1) Kiểm tra quyền tối thiểu: có quyền View không?
            var (hasView, reason) =
                await _permissionService.CheckBoardPermissionAsync(userId, boardId, Permissions.Boards.View);
            if (!hasView)
            {
                // Không có quyền xem -> chặn join hoàn toàn
                await Clients.Caller.SendAsync("JoinDenied", new { boardId, reason });
                return;
            }

            // 2) Thêm connection vào SignalR group để nhận update (viewer/public cũng cần nhận update)
            await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(boardId));

            // 3) Quyết định có thêm vào presence hay không:
            //    Nếu user thực sự là owner/member (có trong GetUserBoardPermissionsAsync) -> thêm presence
            //    Nếu không (ví dụ: public viewer) -> không thêm presence, và không broadcast UserJoined
            var userBoards = await _permissionService.GetUserBoardPermissionsAsync(userId);
            var isMemberOrOwner = userBoards.ContainsKey(boardId);

            if (isMemberOrOwner)
            {
                // đảm bảo UserDto đã được set (OnConnectedAsync có thể đã set)
                if (!_presence.TryGetUserForConnection(Context.ConnectionId, out var user))
                {
                    user = new UserDto(userId, userName);
                    _presence.SetUserForConnection(Context.ConnectionId, user);
                }

                // add vào presence mapping cho board
                _presence.AddConnectionToBoard(Context.ConnectionId, boardId);

                // nếu đây là lần đầu user xuất hiện trong board -> broadcast UserJoined
                var alreadyPresent = _presence.HasOtherConnectionsInBoard(user.Id, boardId, Context.ConnectionId);
                if (!alreadyPresent)
                {
                    await Clients.Group(GroupName(boardId)).SendAsync("UserJoined", new { boardId, user });
                }

                // thông báo caller đã join thành công dưới vai trò member
                await Clients.Caller.SendAsync("JoinSuccess", new { boardId, role = "member" });
            }
            else
            {
                // public viewer — không hiện trong danh sách online
                await Clients.Caller.SendAsync("JoinSuccess", new { boardId, role = "viewer" });
            }
        }

        public async Task LeaveBoard(string boardId)
        {
            if (string.IsNullOrWhiteSpace(boardId)) return;

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(boardId));

            // Nếu connection được thêm vào presence trước đó -> remove và broadcast UserLeft khi cần
            // (RemoveConnectionFromBoard an toàn ngay cả khi connection chưa tồn tại trong presence)
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