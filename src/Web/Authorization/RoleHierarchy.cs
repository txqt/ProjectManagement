namespace ProjectManagement.Authorization
{
    /// <summary>
    /// Quản lý hierarchy của roles trong hệ thống
    /// Hierarchy: SuperAdmin > Admin > User
    /// Board level: Owner > Admin > Member > Viewer
    /// </summary>
    public static class RoleHierarchy
    {
        // ============ SYSTEM ROLES ============
        public const string SuperAdmin = "SuperAdmin";
        public const string Admin = "Admin";
        public const string User = "User";

        // ============ BOARD ROLES ============
        public const string Owner = "owner";
        public const string BoardAdmin = "admin";
        public const string Member = "member";
        public const string Viewer = "viewer";

        // System role hierarchy (higher number = higher authority)
        private static readonly Dictionary<string, int> SystemRoleRanks = new()
        {
            { SuperAdmin, 100 },
            { Admin, 50 },
            { User, 10 }
        };

        // Board role hierarchy (higher number = higher authority)
        private static readonly Dictionary<string, int> BoardRoleRanks = new()
        {
            { Owner, 100 },
            { BoardAdmin, 50 },
            { Member, 20 },
            { Viewer, 10 }
        };

        /// <summary>
        /// Kiểm tra xem role A có cao hơn role B không (System level)
        /// </summary>
        public static bool IsSystemRoleHigherThan(string roleA, string roleB)
        {
            var rankA = SystemRoleRanks.GetValueOrDefault(roleA, 0);
            var rankB = SystemRoleRanks.GetValueOrDefault(roleB, 0);
            return rankA > rankB;
        }

        /// <summary>
        /// Kiểm tra xem role A có cao hơn hoặc bằng role B không (System level)
        /// </summary>
        public static bool IsSystemRoleHigherOrEqual(string roleA, string roleB)
        {
            var rankA = SystemRoleRanks.GetValueOrDefault(roleA, 0);
            var rankB = SystemRoleRanks.GetValueOrDefault(roleB, 0);
            return rankA >= rankB;
        }

        /// <summary>
        /// Kiểm tra xem role A có cao hơn role B không (Board level)
        /// </summary>
        public static bool IsBoardRoleHigherThan(string roleA, string roleB)
        {
            var rankA = BoardRoleRanks.GetValueOrDefault(roleA?.ToLower() ?? "", 0);
            var rankB = BoardRoleRanks.GetValueOrDefault(roleB?.ToLower() ?? "", 0);
            return rankA > rankB;
        }

        /// <summary>
        /// Kiểm tra xem role A có cao hơn hoặc bằng role B không (Board level)
        /// </summary>
        public static bool IsBoardRoleHigherOrEqual(string roleA, string roleB)
        {
            var rankA = BoardRoleRanks.GetValueOrDefault(roleA?.ToLower() ?? "", 0);
            var rankB = BoardRoleRanks.GetValueOrDefault(roleB?.ToLower() ?? "", 0);
            return rankA >= rankB;
        }

        /// <summary>
        /// Lấy rank của system role
        /// </summary>
        public static int GetSystemRoleRank(string role)
        {
            return SystemRoleRanks.GetValueOrDefault(role, 0);
        }

        /// <summary>
        /// Lấy rank của board role
        /// </summary>
        public static int GetBoardRoleRank(string role)
        {
            return BoardRoleRanks.GetValueOrDefault(role?.ToLower() ?? "", 0);
        }

        /// <summary>
        /// Kiểm tra role có hợp lệ không (System level)
        /// </summary>
        public static bool IsValidSystemRole(string role)
        {
            return SystemRoleRanks.ContainsKey(role);
        }

        /// <summary>
        /// Kiểm tra role có hợp lệ không (Board level)
        /// </summary>
        public static bool IsValidBoardRole(string role)
        {
            return BoardRoleRanks.ContainsKey(role?.ToLower() ?? "");
        }

        /// <summary>
        /// Lấy tất cả system roles
        /// </summary>
        public static IEnumerable<string> GetAllSystemRoles()
        {
            return SystemRoleRanks.Keys;
        }

        /// <summary>
        /// Lấy tất cả board roles
        /// </summary>
        public static IEnumerable<string> GetAllBoardRoles()
        {
            return BoardRoleRanks.Keys;
        }

        /// <summary>
        /// Lấy các roles thấp hơn role hiện tại (System level)
        /// </summary>
        public static IEnumerable<string> GetLowerSystemRoles(string role)
        {
            var currentRank = GetSystemRoleRank(role);
            return SystemRoleRanks
                .Where(kvp => kvp.Value < currentRank)
                .Select(kvp => kvp.Key)
                .OrderByDescending(r => SystemRoleRanks[r]);
        }

        /// <summary>
        /// Lấy các roles thấp hơn role hiện tại (Board level)
        /// </summary>
        public static IEnumerable<string> GetLowerBoardRoles(string role)
        {
            var currentRank = GetBoardRoleRank(role);
            return BoardRoleRanks
                .Where(kvp => kvp.Value < currentRank)
                .Select(kvp => kvp.Key)
                .OrderByDescending(r => BoardRoleRanks[r]);
        }

        /// <summary>
        /// Kiểm tra có thể assign role target không dựa trên role hiện tại
        /// </summary>
        public static (bool CanAssign, string Reason) CanAssignSystemRole(
            string currentUserRole, 
            string targetRole)
        {
            if (!IsValidSystemRole(currentUserRole))
                return (false, "Invalid current role");

            if (!IsValidSystemRole(targetRole))
                return (false, "Invalid target role");

            // Chỉ có thể assign role thấp hơn mình
            if (!IsSystemRoleHigherThan(currentUserRole, targetRole))
                return (false, $"Cannot assign role '{targetRole}'. You can only assign roles lower than your current role '{currentUserRole}'");

            return (true, "OK");
        }

        /// <summary>
        /// Kiểm tra có thể thay đổi role của member không
        /// </summary>
        public static (bool CanChange, string Reason) CanChangeBoardMemberRole(
            string currentUserRole,
            string targetMemberCurrentRole, 
            string targetMemberNewRole)
        {
            if (!IsValidBoardRole(currentUserRole))
                return (false, "Invalid current user role");

            if (!IsValidBoardRole(targetMemberCurrentRole))
                return (false, "Invalid target member current role");

            if (!IsValidBoardRole(targetMemberNewRole))
                return (false, "Invalid target member new role");

            // Owner không thể tự thay đổi role của mình
            if (currentUserRole.ToLower() == Owner && 
                targetMemberCurrentRole.ToLower() == Owner)
                return (false, "Board owner cannot change their own role. Transfer ownership first.");

            // Chỉ có thể thay đổi role của người thấp hơn mình
            if (!IsBoardRoleHigherThan(currentUserRole, targetMemberCurrentRole))
                return (false, $"Cannot modify member with role '{targetMemberCurrentRole}'. You can only modify members with lower roles than your role '{currentUserRole}'");

            // Chỉ có thể assign role thấp hơn hoặc bằng mình (trừ Owner)
            if (targetMemberNewRole.ToLower() == Owner)
                return (false, "Cannot assign Owner role. Use transfer ownership feature instead.");

            if (!IsBoardRoleHigherThan(currentUserRole, targetMemberNewRole))
                return (false, $"Cannot assign role '{targetMemberNewRole}'. You can only assign roles lower than your role '{currentUserRole}'");

            return (true, "OK");
        }

        /// <summary>
        /// Kiểm tra có thể remove member không
        /// </summary>
        public static (bool CanRemove, string Reason) CanRemoveBoardMember(
            string currentUserRole,
            string targetMemberRole,
            bool isSelfRemoval = false)
        {
            if (!IsValidBoardRole(currentUserRole))
                return (false, "Invalid current user role");

            if (!IsValidBoardRole(targetMemberRole))
                return (false, "Invalid target member role");

            // Owner không thể tự remove
            if (isSelfRemoval && currentUserRole.ToLower() == Owner)
                return (false, "Board owner cannot leave the board. Transfer ownership first.");

            // Member có thể tự leave
            if (isSelfRemoval)
                return (true, "OK");

            // Chỉ có thể remove người thấp hơn mình
            if (!IsBoardRoleHigherThan(currentUserRole, targetMemberRole))
                return (false, $"Cannot remove member with role '{targetMemberRole}'. You can only remove members with lower roles than your role '{currentUserRole}'");

            return (true, "OK");
        }
    }
}