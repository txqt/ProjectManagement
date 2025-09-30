using AutoMapper;
using Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Board;
using ProjectManagement.Models.DTOs.Card;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Services
{
    public class CardService : ICardService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly UserManager<ApplicationUser> _userManager;

        public CardService(
            ApplicationDbContext context,
            IMapper mapper,
            UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _mapper = mapper;
            _userManager = userManager;
        }

        public async Task<CardDto?> GetCardAsync(string cardId, string userId)
        {
            var card = await _context.Cards
                .Include(c => c.Board)
                .Include(c => c.Column)
                .Include(c => c.Members)
                    .ThenInclude(cm => cm.User)
                .Include(c => c.Comments)
                    .ThenInclude(comment => comment.User)
                .Include(c => c.Attachments)
                .AsSplitQuery()
                .FirstOrDefaultAsync(c => c.Id == cardId);

            return _mapper.Map<CardDto>(card);
        }

        public async Task<CardDto?> CreateCardAsync(string columnId, CreateCardDto createCardDto, string userId)
        {
            var column = await _context.Columns
                .Include(c => c.Board)
                    .ThenInclude(b => b.Members)
                .FirstOrDefaultAsync(c => c.Id == columnId);

            if (column == null)
                return null;

            var card = _mapper.Map<Card>(createCardDto);
            card.Id = Guid.NewGuid().ToString();
            card.ColumnId = columnId;
            card.BoardId = column.BoardId;
            card.Created = DateTime.UtcNow;
            card.LastModified = DateTime.UtcNow;

            _context.Cards.Add(card);

            // Update column's card order
            column.CardOrderIds.Add(card.Id);
            column.LastModified = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var createdCard = await GetCardAsync(card.Id, userId);
            return createdCard!;
        }

        public async Task<CardDto?> UpdateCardAsync(string cardId, UpdateCardDto updateCardDto, string userId)
        {
            var card = await _context.Cards
                .Include(c => c.Board)
                    .ThenInclude(b => b.Members)
                .Include(c => c.Column)
                .FirstOrDefaultAsync(c => c.Id == cardId);

            if (card == null)
                return null;

            // Handle column change
            if (!string.IsNullOrEmpty(updateCardDto.ColumnId) && updateCardDto.ColumnId != card.ColumnId)
            {
                var newColumn = await _context.Columns.FirstOrDefaultAsync(c => c.Id == updateCardDto.ColumnId);
                if (newColumn == null || newColumn.BoardId != card.BoardId)
                    return null;

                // Remove from old column
                var oldColumn = card.Column;
                oldColumn.CardOrderIds.Remove(cardId);
                oldColumn.LastModified = DateTime.UtcNow;

                // Add to new column
                newColumn.CardOrderIds.Add(cardId);
                newColumn.LastModified = DateTime.UtcNow;

                card.ColumnId = updateCardDto.ColumnId;
            }

            _mapper.Map(updateCardDto, card);
            card.LastModified = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetCardAsync(cardId, userId);
        }

        public async Task<CardDto?> DeleteCardAsync(string cardId, string userId)
        {
            var card = await _context.Cards
                .Include(c => c.Board)
                    .ThenInclude(b => b.Members)
                .Include(c => c.Column)
                .FirstOrDefaultAsync(c => c.Id == cardId);

            if (card == null)
                return null;

            // Remove card from column's order
            var column = card.Column;
            column.CardOrderIds.Remove(cardId);
            column.LastModified = DateTime.UtcNow;

            _context.Cards.Remove(card);
            await _context.SaveChangesAsync();

            var dto = _mapper.Map<CardDto>(card);

            return dto;
        }

        public async Task<CardDto?> MoveCardAsync(string cardId, MoveCardDto moveCardDto, string userId)
        {
            var card = await _context.Cards
                .Include(c => c.Board)
                    .ThenInclude(b => b.Members)
                .Include(c => c.Column)
                .FirstOrDefaultAsync(c => c.Id == cardId);

            if (card == null)
                return null;

            var destinationColumn = await _context.Columns
                .FirstOrDefaultAsync(c => c.Id == moveCardDto.ToColumnId);

            if (destinationColumn == null || destinationColumn.BoardId != card.BoardId)
                return null;

            var sourceColumn = card.Column;

            // Remove from source column
            sourceColumn.CardOrderIds.Remove(cardId);
            sourceColumn.LastModified = DateTime.UtcNow;

            // Add to destination column at specified position
            var position = Math.Max(0, Math.Min(moveCardDto.NewIndex, destinationColumn.CardOrderIds.Count));
            destinationColumn.CardOrderIds.Insert(position, cardId);
            destinationColumn.LastModified = DateTime.UtcNow;

            // Update card's column
            card.ColumnId = moveCardDto.ToColumnId;
            card.LastModified = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var dto = _mapper.Map<CardDto>(card);
            return dto;
        }

        public async Task<CardsReorderedResponse> ReorderCardsAsync(string columnId, List<string> cardOrderIds)
        {
            var column = await _context.Columns
                .Include(x=>x.Board)
                .FirstOrDefaultAsync(b => b.Id == columnId);

            if (column == null)
                throw new Exception("Column not found");

            column.CardOrderIds = cardOrderIds;
            column.LastModified = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return new CardsReorderedResponse()
            {
                BoardId = column.BoardId,
                ColumnId = columnId,
                CardOrderIds = cardOrderIds,
                Timestamp = DateTime.UtcNow
            };
        }

        public async Task<bool> AssignMemberAsync(string cardId, string memberEmail, string userId)
        {

            var user = await _userManager.FindByEmailAsync(memberEmail);
            if (user == null)
                return false;

            var cardMember = new CardMember
            {
                Id = Guid.NewGuid().ToString(),
                CardId = cardId,
                UserId = user.Id,
                AssignedAt = DateTime.UtcNow
            };

            _context.CardMembers.Add(cardMember);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> UnassignMemberAsync(string cardId, string memberId, string userId)
        {
            var cardMember = await _context.CardMembers
                .FirstOrDefaultAsync(cm => cm.Id == memberId && cm.CardId == cardId);

            if (cardMember == null)
                return false;

            _context.CardMembers.Remove(cardMember);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
