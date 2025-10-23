using AutoMapper;
using Infrastructure;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Models.DTOs.Board;
using ProjectManagement.Services.Interfaces;
using System.Security.Cryptography;

namespace ProjectManagement.Services
{
    public class BoardShareService : IBoardShareService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public BoardShareService(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<string> GenerateShareTokenAsync(string boardId, string userId)
        {
            var board = await _context.Boards
                .Include(b => b.Members)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null)
                throw new ArgumentException("Board not found");

            // Check if user has permission (owner or admin)
            if (board.OwnerId != userId &&
                !board.Members.Any(m => m.UserId == userId && (m.Role == "admin" || m.Role == "owner")))
                throw new UnauthorizedAccessException("You don't have permission to generate share link");

            // Generate secure token
            var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
                .Replace("+", "-")
                .Replace("/", "_")
                .TrimEnd('=');

            // Store token in board (you might want to add ShareToken field to Board entity)
            // For now, return the token that includes board ID
            return $"{boardId}:{token}";
        }

        public async Task<BoardDto?> ValidateShareTokenAsync(string token)
        {
            // Extract board ID from token
            var parts = token.Split(':');
            if (parts.Length != 2)
                return null;

            var boardId = parts[0];
            var board = await _context.Boards
                .Include(b => b.Owner)
                .Include(b => b.Members)
                .ThenInclude(m => m.User)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null)
                return null;

            // Check if board allows share links
            if (!board.AllowShareInviteLink)
                return null;

            return _mapper.Map<BoardDto>(board);
        }

        public async Task<bool> RevokeShareTokenAsync(string boardId, string userId)
        {
            var board = await _context.Boards
                .Include(b => b.Members)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null)
                return false;

            // Check permission
            if (board.OwnerId != userId &&
                !board.Members.Any(m => m.UserId == userId && (m.Role == "admin" || m.Role == "owner")))
                return false;

            // In a real implementation, you'd invalidate the token here
            return true;
        }
    }
}