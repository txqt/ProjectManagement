using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using ProjectManagement.Authorization;
using ProjectManagement.Data;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Services;
using System.Security.Claims;
using Xunit;

namespace ProjectManagement.Tests.Services
{
    public class PermissionServiceTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
        private readonly Mock<RoleManager<IdentityRole>> _roleManagerMock;
        private readonly Mock<ILogger<PermissionService>> _loggerMock;
        private readonly PermissionService _permissionService;
        private readonly string _testUserId = "test-user-id";
        private readonly string _adminUserId = "admin-user-id";

        public PermissionServiceTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);

            var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
            _userManagerMock = new Mock<UserManager<ApplicationUser>>(
                userStoreMock.Object, null, null, null, null, null, null, null, null);

            var roleStoreMock = new Mock<IRoleStore<IdentityRole>>();
            _roleManagerMock = new Mock<RoleManager<IdentityRole>>(
                roleStoreMock.Object, null, null, null, null);

            _loggerMock = new Mock<ILogger<PermissionService>>();

            _permissionService = new PermissionService(
                _userManagerMock.Object,
                _roleManagerMock.Object,
                _context,
                _loggerMock.Object
            );

            SeedTestData();
        }

        private void SeedTestData()
        {
            var testUser = new ApplicationUser
            {
                Id = _testUserId,
                UserName = "testuser",
                Email = "test@example.com"
            };

            var adminUser = new ApplicationUser
            {
                Id = _adminUserId,
                UserName = "adminuser",
                Email = "admin@example.com"
            };

            _context.Users.AddRange(testUser, adminUser);
            _context.SaveChanges();
        }

        [Fact]
        public async Task HasSystemPermissionAsync_ShouldReturnTrue_WhenUserHasPermission()
        {
            // Arrange
            var user = await _context.Users.FindAsync(_testUserId);
            var permission = Permissions.System.ViewAllUsers;

            _userManagerMock.Setup(m => m.FindByIdAsync(_testUserId))
                .ReturnsAsync(user);

            _userManagerMock.Setup(m => m.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "Admin" });

            var role = new IdentityRole("Admin");
            _roleManagerMock.Setup(m => m.FindByNameAsync("Admin"))
                .ReturnsAsync(role);

            var claims = new List<Claim>
            {
                new Claim("permission", permission)
            };

            _roleManagerMock.Setup(m => m.GetClaimsAsync(role))
                .ReturnsAsync(claims);

            // Act
            var result = await _permissionService.HasSystemPermissionAsync(_testUserId, permission);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task HasSystemPermissionAsync_ShouldReturnFalse_WhenUserDoesNotHavePermission()
        {
            // Arrange
            var user = await _context.Users.FindAsync(_testUserId);
            var permission = Permissions.System.ManageAllBoards;

            _userManagerMock.Setup(m => m.FindByIdAsync(_testUserId))
                .ReturnsAsync(user);

            _userManagerMock.Setup(m => m.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "User" });

            var role = new IdentityRole("User");
            _roleManagerMock.Setup(m => m.FindByNameAsync("User"))
                .ReturnsAsync(role);

            _roleManagerMock.Setup(m => m.GetClaimsAsync(role))
                .ReturnsAsync(new List<Claim>());

            _userManagerMock.Setup(m => m.GetClaimsAsync(user))
                .ReturnsAsync(new List<Claim>());

            // Act
            var result = await _permissionService.HasSystemPermissionAsync(_testUserId, permission);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task CheckBoardPermissionAsync_ShouldReturnTrue_WhenUserIsOwner()
        {
            // Arrange
            var board = new Board
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Test Board",
                OwnerId = _testUserId,
                CreatedAt = DateTime.UtcNow,
                LastModified = DateTime.UtcNow
            };

            _context.Boards.Add(board);
            await _context.SaveChangesAsync();

            // Act
            var (hasPermission, reason) = await _permissionService.CheckBoardPermissionAsync(
                _testUserId,
                board.Id,
                Permissions.Boards.Delete
            );

            // Assert
            hasPermission.Should().BeTrue();
            reason.Should().Be("Board owner");
        }

        [Fact]
        public async Task CheckBoardPermissionAsync_ShouldReturnTrue_WhenUserHasRolePermission()
        {
            // Arrange
            var board = new Board
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Test Board",
                OwnerId = _adminUserId,
                CreatedAt = DateTime.UtcNow,
                LastModified = DateTime.UtcNow
            };

            var member = new BoardMember
            {
                Id = Guid.NewGuid().ToString(),
                BoardId = board.Id,
                UserId = _testUserId,
                Role = "admin",
                JoinedAt = DateTime.UtcNow
            };

            _context.Boards.Add(board);
            _context.BoardMembers.Add(member);
            await _context.SaveChangesAsync();

            // Act
            var (hasPermission, reason) = await _permissionService.CheckBoardPermissionAsync(
                _testUserId,
                board.Id,
                Permissions.Cards.Create
            );

            // Assert
            hasPermission.Should().BeTrue();
            reason.Should().Contain("admin");
        }

        [Fact]
        public async Task CheckBoardPermissionAsync_ShouldReturnFalse_WhenUserNotMember()
        {
            // Arrange
            var board = new Board
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Test Board",
                Type = "private",
                OwnerId = _adminUserId,
                CreatedAt = DateTime.UtcNow,
                LastModified = DateTime.UtcNow
            };

            _context.Boards.Add(board);
            await _context.SaveChangesAsync();

            // Act
            var (hasPermission, reason) = await _permissionService.CheckBoardPermissionAsync(
                _testUserId,
                board.Id,
                Permissions.Boards.Edit
            );

            // Assert
            hasPermission.Should().BeFalse();
            reason.Should().Be("User is not a board member");
        }

        [Fact]
        public async Task CheckBoardPermissionAsync_ShouldAllowViewOnPublicBoard()
        {
            // Arrange
            var board = new Board
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Public Board",
                Type = "public",
                OwnerId = _adminUserId,
                CreatedAt = DateTime.UtcNow,
                LastModified = DateTime.UtcNow
            };

            _context.Boards.Add(board);
            await _context.SaveChangesAsync();

            // Act
            var (hasPermission, reason) = await _permissionService.CheckBoardPermissionAsync(
                _testUserId,
                board.Id,
                Permissions.Boards.View
            );

            // Assert
            hasPermission.Should().BeTrue();
            reason.Should().Be("Public board view access");
        }

        [Fact]
        public async Task GetUserBoardPermissionsAsync_ShouldReturnCorrectPermissions()
        {
            // Arrange
            var board1 = new Board
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Owned Board",
                OwnerId = _testUserId,
                CreatedAt = DateTime.UtcNow,
                LastModified = DateTime.UtcNow
            };

            var board2 = new Board
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Member Board",
                OwnerId = _adminUserId,
                CreatedAt = DateTime.UtcNow,
                LastModified = DateTime.UtcNow
            };

            var member = new BoardMember
            {
                Id = Guid.NewGuid().ToString(),
                BoardId = board2.Id,
                UserId = _testUserId,
                Role = "member",
                JoinedAt = DateTime.UtcNow
            };

            _context.Boards.AddRange(board1, board2);
            _context.BoardMembers.Add(member);
            await _context.SaveChangesAsync();

            // Act
            var result = await _permissionService.GetUserBoardPermissionsAsync(_testUserId);

            // Assert
            result.Should().ContainKey(board1.Id);
            result.Should().ContainKey(board2.Id);
            
            result[board1.Id].Should().Contain(Permissions.Boards.Delete);
            result[board2.Id].Should().Contain(Permissions.Cards.Create);
            result[board2.Id].Should().NotContain(Permissions.Boards.Delete);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}