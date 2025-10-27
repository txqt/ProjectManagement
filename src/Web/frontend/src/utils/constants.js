export const ACTIVE_DRAG_ITEM_TYPE = {
  COLUMN: 'ACTIVE_DRAG_ITEM_TYPE_COLUMN',
  CARD: 'ACTIVE_DRAG_ITEM_TYPE_CARD'
}

export const NotificationTypes = Object.freeze({
  BoardInvite: "board_invite",
  BoardInviteAccepted: "board_invite_accepted",
  BoardInviteDeclined: "board_invite_declined",
  CardAssigned: "card_assigned",
  CardUnassigned: "card_unassigned",
  CommentAdded: "comment_added",
  CardMoved: "card_moved",
  BoardMemberAdded: "board_member_added",
  BoardMemberRemoved: "board_member_removed",
  BoardDeleted: "board_deleted",
  DueDateReminder: "due_date_reminder",
});

export const InviteStatus = {
  Pending: "pending",
  Accepted: "accepted",
  Declined: "declined",
  Expired: "expired",
  Cancelled: "cancelled",
};