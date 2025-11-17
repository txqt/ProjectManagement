namespace ProjectManagement.Helpers
{
    public static class CacheKeys
    {
        // Board related
        public static string Board(string boardId) => $"board:{boardId}";
        public static string UserBoards(string userId) => $"user_boards:{userId}";
        public static string UserBoardsPattern(string userId) => $"user_boards:{userId}:*";

        public static string BoardInvites(string boardId, string status = "all")
            => $"board_invites:{boardId}:{status}";

        public static string BoardInvitesPattern(string boardId)
            => $"board_invites:{boardId}:*";

        // Card related
        public static string Attachments(string cardId) => $"attachments:{cardId}";

        // Activity related
        public static string ActivitySummary(string boardId, int days)
            => $"activity_summary:{boardId}:{days}";

        // Share token
        public static string ActiveShareToken(string boardId)
            => $"active_share_token:{boardId}";

        // Notifications
        public static string NotificationSummary(string userId)
            => $"notification_summary:{userId}";

        public static string Notifications(string userId, int skip, int take, bool? unreadOnly)
            => $"notifications:{userId}:{skip}:{take}:{unreadOnly}";

        public static string NotificationsPattern(string userId)
            => $"notifications:{userId}:*";

        // Join requests
        public static string BoardJoinRequests(string boardId, string status = "all")
            => $"board_join_requests:{boardId}:{status}";

        public static string BoardJoinRequestsPattern(string boardId)
            => $"board_join_requests:{boardId}:*";

        //Labels
        public static string Labels(string boardId)
            => $"labels:{boardId}";
    }
}