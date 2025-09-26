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
    }
}
