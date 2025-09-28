namespace ProjectManagement.Models.Domain.Entities
{
    public static class NotificationTypes
    {
        public const string BoardInvite = "board_invite";
        public const string BoardInviteAccepted = "board_invite_accepted";
        public const string BoardInviteDeclined = "board_invite_declined";
        public const string CardAssigned = "card_assigned";
        public const string CardUnassigned = "card_unassigned";
        public const string CommentAdded = "comment_added";
        public const string CardMoved = "card_moved";
        public const string BoardMemberAdded = "board_member_added";
        public const string BoardMemberRemoved = "board_member_removed";
        public const string BoardDeleted = "board_deleted";
        public const string DueDateReminder = "due_date_reminder";
    }
}
