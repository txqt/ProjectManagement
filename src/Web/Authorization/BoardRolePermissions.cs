namespace ProjectManagement.Authorization
{
    public static class BoardRolePermissions
    {
        public static readonly string[] ViewerPermissions = {
            Permissions.Boards.View,
            Permissions.Columns.View,
            Permissions.Cards.View
        };

        public static readonly string[] MemberPermissions =
            ViewerPermissions.Concat(new[]
            {
                Permissions.Columns.Create,
                Permissions.Columns.Edit,
                Permissions.Cards.Create,
                Permissions.Cards.Edit,
                Permissions.Cards.Move,
                Permissions.Cards.Assign,
                Permissions.Cards.Comment,
                Permissions.Cards.Attach
            }).ToArray();

        public static readonly string[] AdminPermissions =
            MemberPermissions.Concat(new[]
            {
                Permissions.Boards.Edit,
                Permissions.Boards.ManageMembers,
                Permissions.Columns.Delete,
                Permissions.Columns.Reorder,
                Permissions.Cards.Delete
            }).ToArray();

        public static readonly string[] OwnerPermissions =
            AdminPermissions.Concat(new[]
            {
                Permissions.Boards.Delete,
                Permissions.Boards.ChangeVisibility
            }).ToArray();

        public static string[] GetPermissionsForRole(string role)
        {
            return role.ToLower() switch
            {
                "owner" => OwnerPermissions,
                "admin" => AdminPermissions,
                "member" => MemberPermissions,
                "viewer" => ViewerPermissions,
                _ => Array.Empty<string>()
            };
        }
    }
}
