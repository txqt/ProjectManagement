namespace ProjectManagement.Authorization
{
    public static class Permissions
    {
        // ============ SYSTEM LEVEL PERMISSIONS ============
        // Chỉ dành cho Admin/Super Admin - áp dụng toàn hệ thống
        public static class System
        {
            public const string ViewAllUsers = "system.view_all_users";
            public const string ManageUsers = "system.manage_users";
            public const string ViewAllBoards = "system.view_all_boards";
            public const string ManageAllBoards = "system.manage_all_boards";
            public const string ViewSystemStats = "system.view_stats";
            public const string ManageSystemSettings = "system.manage_settings";
        }

        // ============ BOARD LEVEL PERMISSIONS ============  
        // Permissions này sẽ được check dựa trên board membership
        public static class Boards
        {
            public const string View = "boards.view";
            public const string Create = "boards.create"; // System-wide: user có thể tạo board mới
            public const string Edit = "boards.edit"; // Board-level: edit board cụ thể
            public const string Delete = "boards.delete"; // Board-level: delete board cụ thể
            public const string ManageMembers = "boards.manage_members"; // Board-level
            public const string ChangeVisibility = "boards.change_visibility"; // Board-level
        }

        public static class Columns
        {
            public const string View = "columns.view"; // Board-level
            public const string Create = "columns.create"; // Board-level  
            public const string Edit = "columns.edit"; // Board-level
            public const string Delete = "columns.delete"; // Board-level
            public const string Reorder = "columns.reorder"; // Board-level
        }

        public static class Cards
        {
            public const string View = "cards.view"; // Board-level
            public const string Create = "cards.create"; // Board-level
            public const string Edit = "cards.edit"; // Board-level
            public const string Delete = "cards.delete"; // Board-level
            public const string Move = "cards.move"; // Board-level
            public const string Assign = "cards.assign"; // Board-level
            public const string Comment = "cards.comment"; // Board-level
            public const string Attach = "cards.attach"; // Board-level
        }

        // Helper methods
        public static IEnumerable<string> GetSystemPermissions()
        {
            return typeof(System).GetFields()
                .Where(field => field.IsLiteral && field.FieldType == typeof(string))
                .Select(field => field.GetValue(null)?.ToString())
                .Where(value => !string.IsNullOrEmpty(value))
                .Cast<string>();
        }

        public static IEnumerable<string> GetBoardLevelPermissions()
        {
            var boardPermissions = typeof(Boards).GetFields()
                .Where(field => field.IsLiteral && field.FieldType == typeof(string))
                .Select(field => field.GetValue(null)?.ToString());

            var columnPermissions = typeof(Columns).GetFields()
                .Where(field => field.IsLiteral && field.FieldType == typeof(string))
                .Select(field => field.GetValue(null)?.ToString());

            var cardPermissions = typeof(Cards).GetFields()
                .Where(field => field.IsLiteral && field.FieldType == typeof(string))
                .Select(field => field.GetValue(null)?.ToString());

            return boardPermissions.Concat(columnPermissions).Concat(cardPermissions)
                .Where(value => !string.IsNullOrEmpty(value))
                .Cast<string>();
        }

        public static IEnumerable<string> GetAllPermissions()
        {
            return GetSystemPermissions().Concat(GetBoardLevelPermissions());
        }
    }
}
