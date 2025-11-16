using AutoMapper;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Moq;
using ProjectManagement.Data;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Board;
using ProjectManagement.Models.DTOs.Common;
using ProjectManagement.Services;
using ProjectManagement.Services.Interfaces;
using Xunit;

namespace ProjectManagement.Tests.Services
{
    public class BoardServiceTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
        private readonly Mock<ICacheService> _cacheMock;
        private readonly BoardService _boardService;
        private readonly string _testUserId = "test-user-id";

        public BoardServiceTests()
        {
            // Setup InMemory Database
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);

            // Setup Mocks
            _mapperMock = new Mock<IMapper>();
            _cacheMock = new Mock<ICacheService>();
            
            var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
            _userManagerMock = new Mock<UserManager<ApplicationUser>>(
                userStoreMock.Object, null, null, null, null, null, null, null, null);

            _boardService = new BoardService(
                _context,
                _mapperMock.Object,
                _userManagerMock.Object,
                _cacheMock.Object
            );

            // Seed test data
            SeedTestData();
        }

        private void SeedTestData()
        {
            var user = new ApplicationUser
            {
                Id = _testUserId,
                UserName = "testuser",
                Email = "test@example.com"
            };

            _context.Users.Add(user);
            _context.SaveChanges();
        }

        [Fact]
        public async Task CreateBoardAsync_ShouldCreateBoard_WithValidData()
        {
            // Arrange
            var createDto = new CreateBoardDto
            {
                Title = "Test Board",
                Description = "Test Description",
                Type = "public"
            };

            var expectedBoard = new Board
            {
                Id = Guid.NewGuid().ToString(),
                Title = createDto.Title,
                Description = createDto.Description,
                Type = createDto.Type,
                OwnerId = _testUserId
            };

            _mapperMock.Setup(m => m.Map<Board>(createDto))
                .Returns(expectedBoard);

            var expectedDto = new BoardDto
            {
                Id = expectedBoard.Id,
                Title = expectedBoard.Title,
                Description = expectedBoard.Description,
                Type = expectedBoard.Type
            };

            _mapperMock.Setup(m => m.Map<BoardDto>(It.IsAny<Board>()))
                .Returns(expectedDto);

            // Act
            var result = await _boardService.CreateBoardAsync(createDto, _testUserId);

            // Assert
            result.Should().NotBeNull();
            result.Title.Should().Be(createDto.Title);
            result.Description.Should().Be(createDto.Description);
            
            var boardInDb = await _context.Boards.FirstOrDefaultAsync(b => b.Title == createDto.Title);
            boardInDb.Should().NotBeNull();
            boardInDb!.OwnerId.Should().Be(_testUserId);
        }

        [Fact]
        public async Task GetUserBoardsAsync_ShouldReturnOnlyUserBoards()
        {
            // Arrange
            var ownedBoard = new Board
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Owned Board",
                OwnerId = _testUserId,
                CreatedAt = DateTime.UtcNow,
                LastModified = DateTime.UtcNow
            };

            var otherUserBoard = new Board
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Other User Board",
                OwnerId = "other-user-id",
                CreatedAt = DateTime.UtcNow,
                LastModified = DateTime.UtcNow
            };

            _context.Boards.AddRange(ownedBoard, otherUserBoard);
            await _context.SaveChangesAsync();

            var expectedDto = new BoardDto { Id = ownedBoard.Id, Title = ownedBoard.Title };

            _mapperMock.Setup(m => m.Map<IEnumerable<BoardDto>>(It.IsAny<List<Board>>()))
                .Returns(new List<BoardDto> { expectedDto });

            _cacheMock.Setup(c => c.GetAsync<IEnumerable<BoardDto>>(It.IsAny<string>()))
                .ReturnsAsync((IEnumerable<BoardDto>)null);

            // Act
            var result = await _boardService.GetUserBoardsAsync(
                _testUserId, 
                new PaginationParams(), 
                "", 
                "title", 
                "asc");

            // Assert
            result.Should().NotBeNull();
            result.Items.Should().HaveCount(1);
            result.Items.First().Title.Should().Be("Owned Board");
            result.TotalCount.Should().Be(1);
        }

        [Fact]
        public async Task UpdateBoardAsync_ShouldUpdateBoard_WhenBoardExists()
        {
            // Arrange
            var board = new Board
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Original Title",
                Description = "Original Description",
                OwnerId = _testUserId,
                CreatedAt = DateTime.UtcNow,
                LastModified = DateTime.UtcNow
            };

            _context.Boards.Add(board);
            await _context.SaveChangesAsync();

            var updateDto = new UpdateBoardDto
            {
                Title = "Updated Title",
                Description = "Updated Description"
            };

            var updatedBoardDto = new BoardDto
            {
                Id = board.Id,
                Title = updateDto.Title,
                Description = updateDto.Description
            };

            _mapperMock.Setup(m => m.Map(updateDto, board))
                .Returns(board);

            _cacheMock.Setup(c => c.GetAsync<BoardDto>(It.IsAny<string>()))
                .ReturnsAsync((BoardDto)null);

            _mapperMock.Setup(m => m.Map<BoardDto>(It.IsAny<Board>()))
                .Returns(updatedBoardDto);

            // Act
            var result = await _boardService.UpdateBoardAsync(board.Id, updateDto, _testUserId);

            // Assert
            result.Should().NotBeNull();
            result!.Title.Should().Be("Updated Title");
            
            var boardInDb = await _context.Boards.FindAsync(board.Id);
            boardInDb!.LastModified.Should().BeAfter(board.CreatedAt);
        }

        [Fact]
        public async Task DeleteBoardAsync_ShouldReturnTrue_WhenBoardExistsAndUserIsOwner()
        {
            // Arrange
            var board = new Board
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Board to Delete",
                OwnerId = _testUserId,
                CreatedAt = DateTime.UtcNow,
                LastModified = DateTime.UtcNow
            };

            _context.Boards.Add(board);
            await _context.SaveChangesAsync();

            // Act
            var result = await _boardService.DeleteBoardAsync(board.Id, _testUserId);

            // Assert
            result.Should().BeTrue();
            var boardInDb = await _context.Boards.FindAsync(board.Id);
            boardInDb.Should().BeNull();
        }

        [Fact]
        public async Task DeleteBoardAsync_ShouldReturnFalse_WhenUserIsNotOwner()
        {
            // Arrange
            var board = new Board
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Board to Delete",
                OwnerId = "other-user-id",
                CreatedAt = DateTime.UtcNow,
                LastModified = DateTime.UtcNow
            };

            _context.Boards.Add(board);
            await _context.SaveChangesAsync();

            // Act
            var result = await _boardService.DeleteBoardAsync(board.Id, _testUserId);

            // Assert
            result.Should().BeFalse();
            var boardInDb = await _context.Boards.FindAsync(board.Id);
            boardInDb.Should().NotBeNull();
        }

        [Fact]
        public async Task AddMemberAsync_ShouldThrowException_WhenBoardNotFound()
        {
            // Arrange
            var addMemberDto = new AddBoardMemberDto
            {
                Email = "newmember@example.com",
                Role = "member"
            };

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _boardService.AddMemberAsync("non-existent-board", addMemberDto, _testUserId)
            );
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}