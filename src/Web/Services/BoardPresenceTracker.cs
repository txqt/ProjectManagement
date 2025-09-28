using ProjectManagement.Models.DTOs;
using System.Collections.Concurrent;

namespace ProjectManagement.Services
{
    public class BoardPresenceTracker
    {
        // connectionId -> set of boardIds
        private readonly ConcurrentDictionary<string, HashSet<string>> _connectionBoards = new();

        // connectionId -> UserDto (optional)
        private readonly ConcurrentDictionary<string, UserDto> _connectionUsers = new();

        public void SetUserForConnection(string connectionId, UserDto user)
        {
            _connectionUsers[connectionId] = user;
        }

        public bool TryRemoveUserForConnection(string connectionId, out UserDto? user)
        {
            if (_connectionUsers.TryRemove(connectionId, out var u))
            {
                user = u;
                return true;
            }
            user = null;
            return false;
        }

        public void AddConnectionToBoard(string connectionId, string boardId)
        {
            var set = _connectionBoards.GetOrAdd(connectionId, _ => new HashSet<string>());
            lock (set) { set.Add(boardId); }
        }

        public void RemoveConnectionFromBoard(string connectionId, string boardId)
        {
            if (_connectionBoards.TryGetValue(connectionId, out var set))
            {
                lock (set) { set.Remove(boardId); }
                if (set.Count == 0) _connectionBoards.TryRemove(connectionId, out _);
            }
        }

        public IEnumerable<string> GetBoardsForConnection(string connectionId)
            => _connectionBoards.TryGetValue(connectionId, out var set) ? set.ToArray() : Array.Empty<string>();

        public IEnumerable<(string ConnectionId, UserDto User)> GetAllConnections()
        {
            foreach (var kv in _connectionUsers)
            {
                yield return (kv.Key, kv.Value);
            }
        }

        public IEnumerable<UserDto> GetUsersInBoard(string boardId)
        {
            var seenUserIds = new HashSet<string>();
            var result = new List<UserDto>();

            // enumerate snapshot trên ConcurrentDictionary — an toàn cho concurrent read
            foreach (var kv in _connectionBoards)
            {
                var connectionId = kv.Key;
                var set = kv.Value;
                // lock nhỏ khi đọc set để tránh race với Add/Remove trên cùng set
                lock (set)
                {
                    if (!set.Contains(boardId)) continue;
                }

                if (_connectionUsers.TryGetValue(connectionId, out var user) && user != null)
                {
                    if (seenUserIds.Add(user.Id)) // tránh duplicate khi user có nhiều connection
                    {
                        result.Add(user);
                    }
                }
            }

            return result;
        }

        public IEnumerable<(string ConnectionId, UserDto User)> GetConnectionsForBoard(string boardId)
        {
            foreach (var kv in _connectionBoards)
            {
                var connectionId = kv.Key;
                var set = kv.Value;
                lock (set)
                {
                    if (!set.Contains(boardId)) continue;
                }

                if (_connectionUsers.TryGetValue(connectionId, out var user) && user != null)
                {
                    yield return (connectionId, user);
                }
            }
        }
    }
}
