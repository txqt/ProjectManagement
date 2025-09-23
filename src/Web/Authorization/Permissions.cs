namespace ProjectManagement.Authorization
{
    public static class Permissions
    {
        // Board permissions
        public static class Boards
        {
            public const string View = "boards.view";
            public const string Create = "boards.create";
            public const string Edit = "boards.edit";
            public const string Delete = "boards.delete";
            public const string ManageMembers = "boards.manage_members";
        }

        // Column permissions
        public static class Columns
        {
            public const string View = "columns.view";
            public const string Create = "columns.create";
            public const string Edit = "columns.edit";
            public const string Delete = "columns.delete";
            public const string Reorder = "columns.reorder";
        }

        // Card permissions
        public static class Cards
        {
            public const string View = "cards.view";
            public const string Create = "cards.create";
            public const string Edit = "cards.edit";
            public const string Delete = "cards.delete";
            public const string Move = "cards.move";
            public const string Assign = "cards.assign";
            public const string Comment = "cards.comment";
            public const string Attach = "cards.attach";
        }

        // Admin permissions
        public static class Admin
        {
            public const string ViewUsers = "admin.view_users";
            public const string ManageUsers = "admin.manage_users";
            public const string ViewAllBoards = "admin.view_all_boards";
            public const string ManageAllBoards = "admin.manage_all_boards";
        }

        public static IEnumerable<string> GetAllPermissions()
        {
            return typeof(Permissions).GetNestedTypes()
                .SelectMany(type => type.GetFields())
                .Where(field => field.IsLiteral && field.FieldType == typeof(string))
                .Select(field => field.GetValue(null)?.ToString())
                .Where(value => !string.IsNullOrEmpty(value))
                .Cast<string>()
                .ToList();
        }
    }
}
