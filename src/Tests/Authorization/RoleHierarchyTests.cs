using FluentAssertions;
using ProjectManagement.Authorization;
using Xunit;

namespace ProjectManagement.Tests.Authorization
{
    public class RoleHierarchyTests
    {
        [Theory]
        [InlineData("SuperAdmin", "Admin", true)]
        [InlineData("SuperAdmin", "User", true)]
        [InlineData("Admin", "User", true)]
        [InlineData("User", "Admin", false)]
        [InlineData("Admin", "SuperAdmin", false)]
        public void IsSystemRoleHigherThan_ShouldReturnCorrectResult(
            string roleA, string roleB, bool expected)
        {
            // Act
            var result = RoleHierarchy.IsSystemRoleHigherThan(roleA, roleB);

            // Assert
            result.Should().Be(expected);
        }

        [Theory]
        [InlineData("owner", "admin", true)]
        [InlineData("admin", "member", true)]
        [InlineData("member", "viewer", true)]
        [InlineData("viewer", "member", false)]
        [InlineData("member", "admin", false)]
        public void IsBoardRoleHigherThan_ShouldReturnCorrectResult(
            string roleA, string roleB, bool expected)
        {
            // Act
            var result = RoleHierarchy.IsBoardRoleHigherThan(roleA, roleB);

            // Assert
            result.Should().Be(expected);
        }

        [Theory]
        [InlineData("SuperAdmin", true)]
        [InlineData("Admin", true)]
        [InlineData("User", true)]
        [InlineData("InvalidRole", false)]
        public void IsValidSystemRole_ShouldReturnCorrectResult(
            string role, bool expected)
        {
            // Act
            var result = RoleHierarchy.IsValidSystemRole(role);

            // Assert
            result.Should().Be(expected);
        }

        [Theory]
        [InlineData("owner", true)]
        [InlineData("admin", true)]
        [InlineData("member", true)]
        [InlineData("viewer", true)]
        [InlineData("invalidrole", false)]
        public void IsValidBoardRole_ShouldReturnCorrectResult(
            string role, bool expected)
        {
            // Act
            var result = RoleHierarchy.IsValidBoardRole(role);

            // Assert
            result.Should().Be(expected);
        }

        [Theory]
        [InlineData("SuperAdmin", "Admin", true)]
        [InlineData("SuperAdmin", "User", true)]
        [InlineData("Admin", "SuperAdmin", false)]
        [InlineData("User", "Admin", false)]
        public void CanAssignSystemRole_ShouldReturnCorrectResult(
            string currentRole, string targetRole, bool expectedCanAssign)
        {
            // Act
            var (canAssign, reason) = RoleHierarchy.CanAssignSystemRole(
                currentRole, targetRole);

            // Assert
            canAssign.Should().Be(expectedCanAssign);
            if (!canAssign)
            {
                reason.Should().NotBeNullOrEmpty();
            }
        }

        [Fact]
        public void CanChangeBoardMemberRole_OwnerCanChangeAdminToMember()
        {
            // Arrange
            var currentUserRole = "owner";
            var targetMemberCurrentRole = "admin";
            var targetMemberNewRole = "member";

            // Act
            var (canChange, reason) = RoleHierarchy.CanChangeBoardMemberRole(
                currentUserRole,
                targetMemberCurrentRole,
                targetMemberNewRole
            );

            // Assert
            canChange.Should().BeTrue();
            reason.Should().Be("OK");
        }

        [Fact]
        public void CanChangeBoardMemberRole_MemberCannotChangeAdmin()
        {
            // Arrange
            var currentUserRole = "member";
            var targetMemberCurrentRole = "admin";
            var targetMemberNewRole = "member";

            // Act
            var (canChange, reason) = RoleHierarchy.CanChangeBoardMemberRole(
                currentUserRole,
                targetMemberCurrentRole,
                targetMemberNewRole
            );

            // Assert
            canChange.Should().BeFalse();
            reason.Should().ContainEquivalentOf("cannot modify member");
        }

        [Fact]
        public void CanChangeBoardMemberRole_CannotAssignOwnerRole()
        {
            // Arrange
            var currentUserRole = "owner";
            var targetMemberCurrentRole = "admin";
            var targetMemberNewRole = "owner";

            // Act
            var (canChange, reason) = RoleHierarchy.CanChangeBoardMemberRole(
                currentUserRole,
                targetMemberCurrentRole,
                targetMemberNewRole
            );

            // Assert
            canChange.Should().BeFalse();
            reason.Should().Contain("Cannot assign Owner role");
        }

        [Fact]
        public void CanRemoveBoardMember_OwnerCanRemoveMember()
        {
            // Arrange
            var currentUserRole = "owner";
            var targetMemberRole = "member";

            // Act
            var (canRemove, reason) = RoleHierarchy.CanRemoveBoardMember(
                currentUserRole,
                targetMemberRole,
                isSelfRemoval: false
            );

            // Assert
            canRemove.Should().BeTrue();
            reason.Should().Be("OK");
        }

        [Fact]
        public void CanRemoveBoardMember_OwnerCannotRemoveSelf()
        {
            // Arrange
            var currentUserRole = "owner";
            var targetMemberRole = "owner";

            // Act
            var (canRemove, reason) = RoleHierarchy.CanRemoveBoardMember(
                currentUserRole,
                targetMemberRole,
                isSelfRemoval: true
            );

            // Assert
            canRemove.Should().BeFalse();
            reason.Should().Contain("cannot leave the board");
        }

        [Fact]
        public void CanRemoveBoardMember_MemberCanRemoveSelf()
        {
            // Arrange
            var currentUserRole = "member";
            var targetMemberRole = "member";

            // Act
            var (canRemove, reason) = RoleHierarchy.CanRemoveBoardMember(
                currentUserRole,
                targetMemberRole,
                isSelfRemoval: true
            );

            // Assert
            canRemove.Should().BeTrue();
            reason.Should().Be("OK");
        }

        [Fact]
        public void GetLowerSystemRoles_ShouldReturnCorrectRoles()
        {
            // Act
            var result = RoleHierarchy.GetLowerSystemRoles("SuperAdmin").ToList();

            // Assert
            result.Should().Contain("Admin");
            result.Should().Contain("User");
            result.Should().NotContain("SuperAdmin");
        }

        [Fact]
        public void GetLowerBoardRoles_ShouldReturnCorrectRoles()
        {
            // Act
            var result = RoleHierarchy.GetLowerBoardRoles("owner").ToList();

            // Assert
            result.Should().Contain("admin");
            result.Should().Contain("member");
            result.Should().Contain("viewer");
            result.Should().NotContain("owner");
        }

        [Theory]
        [InlineData("SuperAdmin", 100)]
        [InlineData("Admin", 50)]
        [InlineData("User", 10)]
        public void GetSystemRoleRank_ShouldReturnCorrectRank(
            string role, int expectedRank)
        {
            // Act
            var result = RoleHierarchy.GetSystemRoleRank(role);

            // Assert
            result.Should().Be(expectedRank);
        }

        [Theory]
        [InlineData("owner", 100)]
        [InlineData("admin", 50)]
        [InlineData("member", 20)]
        [InlineData("viewer", 10)]
        public void GetBoardRoleRank_ShouldReturnCorrectRank(
            string role, int expectedRank)
        {
            // Act
            var result = RoleHierarchy.GetBoardRoleRank(role);

            // Assert
            result.Should().Be(expectedRank);
        }
    }
}