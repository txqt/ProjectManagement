using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Infrastructure;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Search;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SearchController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public SearchController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        /// <summary>
        /// Quick search for suggestions - returns limited results
        /// </summary>
        [HttpGet("quick")]
        public async Task<ActionResult<QuickSearchResultDto>> QuickSearch(
            [FromQuery] string q,
            [FromQuery] int limit = 5)
        {
            if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
                return BadRequest("Query must be at least 2 characters");

            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var query = q.Trim().ToLower();

            // Search boards user has access to
            var boards = await _context.Boards
                .Include(b => b.Owner)
                .Where(b => 
                    (b.OwnerId == userId || b.Members.Any(m => m.UserId == userId)) &&
                    (b.Title.ToLower().Contains(query) || 
                     b.Description.ToLower().Contains(query)))
                .OrderByDescending(b => b.LastModified)
                .Take(limit)
                .Select(b => new SearchBoardDto
                {
                    Id = b.Id,
                    Title = b.Title,
                    Description = b.Description,
                    Type = b.Type,
                    Cover = b.Cover,
                    OwnerName = b.Owner.UserName
                })
                .ToListAsync();

            // Search cards in accessible boards
            var cards = await _context.Cards
                .Include(c => c.Board)
                .Include(c => c.Column)
                .Where(c => 
                    (c.Board.OwnerId == userId || c.Board.Members.Any(m => m.UserId == userId)) &&
                    (c.Title.ToLower().Contains(query) || 
                     c.Description.ToLower().Contains(query)))
                .OrderByDescending(c => c.LastModified)
                .Take(limit)
                .Select(c => new SearchCardDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Description = c.Description,
                    Cover = c.Cover,
                    BoardId = c.BoardId,
                    BoardTitle = c.Board.Title,
                    ColumnId = c.ColumnId,
                    ColumnTitle = c.Column.Title
                })
                .ToListAsync();

            // Search users (for mentions/assignments)
            var users = await _userManager.Users
                .Where(u => 
                    u.UserName.ToLower().Contains(query) || 
                    u.Email.ToLower().Contains(query))
                .Take(limit)
                .Select(u => new SearchUserDto
                {
                    Id = u.Id,
                    UserName = u.UserName,
                    Avatar = u.Avatar
                })
                .ToListAsync();

            return Ok(new QuickSearchResultDto
            {
                Query = q,
                Boards = boards,
                Cards = cards,
                Users = users,
                ReturnedCount = boards.Count + cards.Count + users.Count
            });
        }

        /// <summary>
        /// Advanced search with filtering and pagination
        /// </summary>
        [HttpPost("advanced")]
        public async Task<ActionResult<AdvancedSearchResultDto>> AdvancedSearch(
            [FromBody] AdvancedSearchRequestDto request)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var query = (request.Query ?? "").Trim().ToLower();
            var page = Math.Max(1, request.Page);
            var pageSize = Math.Clamp(request.PageSize, 1, 50);
            var skip = (page - 1) * pageSize;

            var result = new AdvancedSearchResultDto
            {
                Query = request.Query,
                Page = page,
                PageSize = pageSize
            };

            // Search Boards
            if (request.SearchBoards)
            {
                var boardsQuery = _context.Boards
                    .Include(b => b.Owner)
                    .Where(b => b.OwnerId == userId || b.Members.Any(m => m.UserId == userId));

                if (!string.IsNullOrEmpty(query))
                {
                    boardsQuery = boardsQuery.Where(b =>
                        b.Title.ToLower().Contains(query) ||
                        b.Description.ToLower().Contains(query));
                }

                if (request.BoardTypes?.Any() == true)
                {
                    boardsQuery = boardsQuery.Where(b => request.BoardTypes.Contains(b.Type));
                }

                if (request.DateFrom.HasValue)
                {
                    boardsQuery = boardsQuery.Where(b => b.CreatedAt >= request.DateFrom.Value);
                }

                if (request.DateTo.HasValue)
                {
                    boardsQuery = boardsQuery.Where(b => b.CreatedAt <= request.DateTo.Value);
                }

                var totalBoards = await boardsQuery.CountAsync();
                var boards = await boardsQuery
                    .OrderByDescending(b => b.LastModified)
                    .Skip(skip)
                    .Take(pageSize)
                    .Select(b => new SearchBoardDto
                    {
                        Id = b.Id,
                        Title = b.Title,
                        Description = b.Description,
                        Type = b.Type,
                        Cover = b.Cover,
                        OwnerName = b.Owner.UserName,
                        CreatedAt = b.CreatedAt,
                        LastModified = b.LastModified
                    })
                    .ToListAsync();

                result.Boards = boards;
                result.TotalBoards = totalBoards;
            }

            // Search Cards
            if (request.SearchCards)
            {
                var cardsQuery = _context.Cards
                    .Include(c => c.Board)
                    .Include(c => c.Column)
                    .Where(c => 
                        c.Board.OwnerId == userId || 
                        c.Board.Members.Any(m => m.UserId == userId));

                if (!string.IsNullOrEmpty(query))
                {
                    cardsQuery = cardsQuery.Where(c =>
                        c.Title.ToLower().Contains(query) ||
                        c.Description.ToLower().Contains(query));
                }

                if (!string.IsNullOrEmpty(request.BoardId))
                {
                    cardsQuery = cardsQuery.Where(c => c.BoardId == request.BoardId);
                }

                if (!string.IsNullOrEmpty(request.ColumnId))
                {
                    cardsQuery = cardsQuery.Where(c => c.ColumnId == request.ColumnId);
                }

                if (request.AssignedToMe)
                {
                    cardsQuery = cardsQuery.Where(c => c.Members.Any(m => m.UserId == userId));
                }

                if (request.DateFrom.HasValue)
                {
                    cardsQuery = cardsQuery.Where(c => c.CreatedAt >= request.DateFrom.Value);
                }

                if (request.DateTo.HasValue)
                {
                    cardsQuery = cardsQuery.Where(c => c.CreatedAt <= request.DateTo.Value);
                }

                var totalCards = await cardsQuery.CountAsync();
                var cards = await cardsQuery
                    .OrderByDescending(c => c.LastModified)
                    .Skip(skip)
                    .Take(pageSize)
                    .Select(c => new SearchCardDto
                    {
                        Id = c.Id,
                        Title = c.Title,
                        Description = c.Description,
                        Cover = c.Cover,
                        BoardId = c.BoardId,
                        BoardTitle = c.Board.Title,
                        ColumnId = c.ColumnId,
                        ColumnTitle = c.Column.Title,
                        CreatedAt = c.CreatedAt,
                        LastModified = c.LastModified
                    })
                    .ToListAsync();

                result.Cards = cards;
                result.TotalCards = totalCards;
            }

            // Search Users
            if (request.SearchUsers)
            {
                var usersQuery = _userManager.Users.AsQueryable();

                if (!string.IsNullOrEmpty(query))
                {
                    usersQuery = usersQuery.Where(u =>
                        u.UserName.ToLower().Contains(query) ||
                        u.Email.ToLower().Contains(query));
                }

                var totalUsers = await usersQuery.CountAsync();
                var users = await usersQuery
                    .OrderBy(u => u.UserName)
                    .Skip(skip)
                    .Take(pageSize)
                    .Select(u => new SearchUserDto
                    {
                        Id = u.Id,
                        UserName = u.UserName,
                        Avatar = u.Avatar
                    })
                    .ToListAsync();

                result.Users = users;
                result.TotalUsers = totalUsers;
            }

            result.TotalResults = result.TotalBoards + result.TotalCards + result.TotalUsers;

            return Ok(result);
        }

        /// <summary>
        /// Get recent searches for current user
        /// </summary>
        [HttpGet("recent")]
        public async Task<ActionResult<List<string>>> GetRecentSearches()
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // You can implement this by storing search history in a separate table
            // For now, return empty list
            return Ok(new List<string>());
        }
    }
}