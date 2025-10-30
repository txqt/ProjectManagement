using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Activity;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Helpers
{
    public static class ActivityLogger
    {
        public static async Task LogCardCreatedAsync(
            IActivityLogService activityLogService,
            string userId,
            string boardId,
            string columnId,
            string cardId,
            string cardTitle)
        {
            await activityLogService.LogActivityAsync(userId, new CreateActivityLogDto
            {
                BoardId = boardId,
                CardId = cardId,
                ColumnId = columnId,
                Action = ActivityActions.Created,
                EntityType = ActivityEntityTypes.Card,
                EntityId = cardId,
                Description = $"added card \"{cardTitle}\"",
                Metadata = new Dictionary<string, object>
                {
                    { "cardTitle", cardTitle }
                }
            });
        }

        public static async Task LogCardUpdatedAsync(
            IActivityLogService activityLogService,
            string userId,
            string boardId,
            string columnId,
            string cardId,
            string cardTitle,
            Dictionary<string, object>? changes = null)
        {
            var description = $"updated card \"{cardTitle}\"";
            
            if (changes != null && changes.Count > 0)
            {
                var changedFields = string.Join(", ", changes.Keys);
                description = $"updated {changedFields} on card \"{cardTitle}\"";
            }

            await activityLogService.LogActivityAsync(userId, new CreateActivityLogDto
            {
                BoardId = boardId,
                CardId = cardId,
                ColumnId = columnId,
                Action = ActivityActions.Updated,
                EntityType = ActivityEntityTypes.Card,
                EntityId = cardId,
                Description = description,
                Metadata = changes ?? new Dictionary<string, object>
                {
                    { "cardTitle", cardTitle }
                }
            });
        }

        public static async Task LogCardMovedAsync(
            IActivityLogService activityLogService,
            string userId,
            string boardId,
            string cardId,
            string cardTitle,
            string fromColumnId,
            string fromColumnTitle,
            string toColumnId,
            string toColumnTitle)
        {
            await activityLogService.LogActivityAsync(userId, new CreateActivityLogDto
            {
                BoardId = boardId,
                CardId = cardId,
                ColumnId = toColumnId,
                Action = ActivityActions.Moved,
                EntityType = ActivityEntityTypes.Card,
                EntityId = cardId,
                Description = $"moved card \"{cardTitle}\" from \"{fromColumnTitle}\" to \"{toColumnTitle}\"",
                Metadata = new Dictionary<string, object>
                {
                    { "cardTitle", cardTitle },
                    { "fromColumnId", fromColumnId },
                    { "fromColumnTitle", fromColumnTitle },
                    { "toColumnId", toColumnId },
                    { "toColumnTitle", toColumnTitle }
                }
            });
        }

        public static async Task LogCardDeletedAsync(
            IActivityLogService activityLogService,
            string userId,
            string boardId,
            string columnId,
            string cardId,
            string cardTitle)
        {
            await activityLogService.LogActivityAsync(userId, new CreateActivityLogDto
            {
                BoardId = boardId,
                CardId = cardId,
                ColumnId = columnId,
                Action = ActivityActions.Deleted,
                EntityType = ActivityEntityTypes.Card,
                EntityId = cardId,
                Description = $"deleted card \"{cardTitle}\"",
                Metadata = new Dictionary<string, object>
                {
                    { "cardTitle", cardTitle }
                }
            });
        }

        public static async Task LogColumnCreatedAsync(
            IActivityLogService activityLogService,
            string userId,
            string boardId,
            string columnId,
            string columnTitle)
        {
            await activityLogService.LogActivityAsync(userId, new CreateActivityLogDto
            {
                BoardId = boardId,
                ColumnId = columnId,
                Action = ActivityActions.Created,
                EntityType = ActivityEntityTypes.Column,
                EntityId = columnId,
                Description = $"added column \"{columnTitle}\"",
                Metadata = new Dictionary<string, object>
                {
                    { "columnTitle", columnTitle }
                }
            });
        }

        public static async Task LogColumnDeletedAsync(
            IActivityLogService activityLogService,
            string userId,
            string boardId,
            string columnId,
            string columnTitle)
        {
            await activityLogService.LogActivityAsync(userId, new CreateActivityLogDto
            {
                BoardId = boardId,
                ColumnId = columnId,
                Action = ActivityActions.Deleted,
                EntityType = ActivityEntityTypes.Column,
                EntityId = columnId,
                Description = $"deleted column \"{columnTitle}\"",
                Metadata = new Dictionary<string, object>
                {
                    { "columnTitle", columnTitle }
                }
            });
        }

        public static async Task LogCommentAddedAsync(
            IActivityLogService activityLogService,
            string userId,
            string boardId,
            string columnId,
            string cardId,
            string cardTitle,
            string commentId)
        {
            await activityLogService.LogActivityAsync(userId, new CreateActivityLogDto
            {
                BoardId = boardId,
                CardId = cardId,
                ColumnId = columnId,
                Action = ActivityActions.Commented,
                EntityType = ActivityEntityTypes.Comment,
                EntityId = commentId,
                Description = $"commented on card \"{cardTitle}\"",
                Metadata = new Dictionary<string, object>
                {
                    { "cardTitle", cardTitle },
                    { "commentId", commentId }
                }
            });
        }

        public static async Task LogAttachmentAddedAsync(
            IActivityLogService activityLogService,
            string userId,
            string boardId,
            string columnId,
            string cardId,
            string cardTitle,
            string attachmentName)
        {
            await activityLogService.LogActivityAsync(userId, new CreateActivityLogDto
            {
                BoardId = boardId,
                CardId = cardId,
                ColumnId = columnId,
                Action = ActivityActions.Attached,
                EntityType = ActivityEntityTypes.Attachment,
                Description = $"attached \"{attachmentName}\" to card \"{cardTitle}\"",
                Metadata = new Dictionary<string, object>
                {
                    { "cardTitle", cardTitle },
                    { "attachmentName", attachmentName }
                }
            });
        }

        public static async Task LogMemberAssignedAsync(
            IActivityLogService activityLogService,
            string userId,
            string boardId,
            string columnId,
            string cardId,
            string cardTitle,
            string assignedUserName)
        {
            await activityLogService.LogActivityAsync(userId, new CreateActivityLogDto
            {
                BoardId = boardId,
                CardId = cardId,
                ColumnId = columnId,
                Action = ActivityActions.Assigned,
                EntityType = ActivityEntityTypes.Member,
                Description = $"assigned {assignedUserName} to card \"{cardTitle}\"",
                Metadata = new Dictionary<string, object>
                {
                    { "cardTitle", cardTitle },
                    { "assignedUserName", assignedUserName }
                }
            });
        }

        public static async Task LogMemberUnassignedAsync(
            IActivityLogService activityLogService,
            string userId,
            string boardId,
            string columnId,
            string cardId,
            string cardTitle,
            string unassignedUserName)
        {
            await activityLogService.LogActivityAsync(userId, new CreateActivityLogDto
            {
                BoardId = boardId,
                CardId = cardId,
                ColumnId = columnId,
                Action = ActivityActions.Unassigned,
                EntityType = ActivityEntityTypes.Member,
                Description = $"removed {unassignedUserName} from card \"{cardTitle}\"",
                Metadata = new Dictionary<string, object>
                {
                    { "cardTitle", cardTitle },
                    { "unassignedUserName", unassignedUserName }
                }
            });
        }

        public static async Task LogBoardMemberJoinedAsync(
            IActivityLogService activityLogService,
            string userId,
            string boardId,
            string joinedUserName)
        {
            await activityLogService.LogActivityAsync(userId, new CreateActivityLogDto
            {
                BoardId = boardId,
                Action = ActivityActions.Joined,
                EntityType = ActivityEntityTypes.Board,
                Description = $"{joinedUserName} joined the board",
                Metadata = new Dictionary<string, object>
                {
                    { "joinedUserName", joinedUserName }
                }
            });
        }
    }
}