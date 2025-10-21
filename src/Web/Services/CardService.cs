﻿using AutoMapper;
using Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Board;
using ProjectManagement.Models.DTOs.Card;
using ProjectManagement.Services.Interfaces;
using LexoAlgorithm;

namespace ProjectManagement.Services
{
    public class CardService : ICardService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IBoardNotificationService _boardNotificationService;
        private readonly INotificationService _notificationService;

        public CardService(
            ApplicationDbContext context,
            IMapper mapper,
            UserManager<ApplicationUser> userManager,
            IBoardNotificationService boardNotificationService,
            INotificationService notificationService)
        {
            _context = context;
            _mapper = mapper;
            _userManager = userManager;
            _boardNotificationService = boardNotificationService;
            _notificationService = notificationService;
        }

        public async Task<CardDto?> GetCardAsync(string cardId)
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
                .Include(c => c.Cards)
                .FirstOrDefaultAsync(c => c.Id == columnId);

            if (column == null)
                return null;

            var card = _mapper.Map<Card>(createCardDto);
            card.Id = Guid.NewGuid().ToString();
            card.ColumnId = columnId;
            card.BoardId = column.BoardId;
            card.CreatedAt = DateTime.UtcNow;
            card.LastModified = DateTime.UtcNow;

            // Generate LexoRank for new card
            // Get the last card's rank in this column
            var lastCard = column.Cards.OrderByDescending(c => c.Rank).FirstOrDefault();
            if (lastCard != null)
            {
                // Insert after the last card
                var lastRank = LexoRank.Parse(lastCard.Rank);
                var newRank = lastRank.GenNext();
                card.Rank = newRank.ToString();
            }
            else
            {
                // First card in column
                card.Rank = LexoRank.Middle().ToString();
            }

            _context.Cards.Add(card);
            await _context.SaveChangesAsync();

            var createdCard = await GetCardAsync(card.Id);
            await _boardNotificationService.BroadcastCardCreated(card.BoardId, card.ColumnId, createdCard, userId);
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
                var newColumn = await _context.Columns
                    .Include(c => c.Cards)
                    .FirstOrDefaultAsync(c => c.Id == updateCardDto.ColumnId);

                if (newColumn == null || newColumn.BoardId != card.BoardId)
                    return null;

                // Generate rank for card in new column (append to end)
                var lastCardInNewColumn = newColumn.Cards.OrderByDescending(c => c.Rank).FirstOrDefault();
                if (lastCardInNewColumn != null)
                {
                    var lastRank = LexoRank.Parse(lastCardInNewColumn.Rank);
                    card.Rank = lastRank.GenNext().ToString();
                }
                else
                {
                    card.Rank = LexoRank.Middle().ToString();
                }

                card.ColumnId = updateCardDto.ColumnId;
            }

            _mapper.Map(updateCardDto, card);
            card.LastModified = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var updatedCard = await GetCardAsync(cardId);
            await _boardNotificationService.BroadcastCardUpdated(card.BoardId, card.ColumnId, updatedCard, userId);

            return updatedCard;
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

            _context.Cards.Remove(card);
            await _context.SaveChangesAsync();

            var dto = _mapper.Map<CardDto>(card);
            await _boardNotificationService.BroadcastCardDeleted(dto.BoardId, dto.ColumnId, cardId, userId);

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
                .Include(c => c.Cards)
                .FirstOrDefaultAsync(c => c.Id == moveCardDto.ToColumnId);

            if (destinationColumn == null || destinationColumn.BoardId != card.BoardId)
                return null;

            string oldColumnId = card.ColumnId;

            // Calculate new rank based on position
            var cardsInDestColumn = destinationColumn.Cards.OrderBy(c => c.Rank).ToList();
            string newRank;

            if (moveCardDto.NewIndex >= cardsInDestColumn.Count)
            {
                // Insert at end
                var lastCard = cardsInDestColumn.LastOrDefault();
                newRank = lastCard != null
                    ? LexoRank.Parse(lastCard.Rank).GenNext().ToString()
                    : LexoRank.Middle().ToString();
            }
            else if (moveCardDto.NewIndex == 0)
            {
                // Insert at beginning
                var firstCard = cardsInDestColumn.FirstOrDefault();
                newRank = firstCard != null
                    ? LexoRank.Parse(firstCard.Rank).GenPrev().ToString()
                    : LexoRank.Middle().ToString();
            }
            else
            {
                // Insert between two cards
                var prevCard = cardsInDestColumn[moveCardDto.NewIndex - 1];
                var nextCard = cardsInDestColumn[moveCardDto.NewIndex];
                var prevRank = LexoRank.Parse(prevCard.Rank);
                var nextRank = LexoRank.Parse(nextCard.Rank);
                var betweenRank = prevRank.Between(nextRank);
                newRank = betweenRank.ToString();
            }

            card.Rank = newRank;
            card.ColumnId = moveCardDto.ToColumnId;
            card.LastModified = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var dto = _mapper.Map<CardDto>(card);
            await _boardNotificationService.BroadcastCardMoved(dto.BoardId, oldColumnId,
                moveCardDto.ToColumnId, cardId, moveCardDto.NewIndex, userId);

            return dto;
        }

        public async Task<bool> ReorderCardsAsync(string boardId, string columnId, List<string> cardIds, string userId)
        {
            var board = await _context.Boards
                .Include(b => b.Members)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null) return false;

            var column = await _context.Columns
                .Include(c => c.Cards)
                .ThenInclude(c => c.Members)
                .FirstOrDefaultAsync(c => c.Id == columnId && c.BoardId == boardId);

            if (column == null) return false;

            var existingCards = column.Cards.ToDictionary(c => c.Id, c => c);
            var newRanks = new List<string>();

            LexoRank? prevRank = null;
            foreach (var cardId in cardIds)
            {
                if (!existingCards.TryGetValue(cardId, out var card)) continue;

                LexoRank newRank;
                if (prevRank == null)
                {
                    // thẻ đầu tiên
                    newRank = LexoRank.Middle();
                }
                else
                {
                    // tạo rank tiếp theo
                    newRank = prevRank.GenNext();
                }

                card.Rank = newRank.ToString();
                card.LastModified = DateTime.UtcNow;
                prevRank = newRank;
                newRanks.Add(card.Rank);
            }

            await _context.SaveChangesAsync();

            var orderedCards = cardIds
                .Where(id => existingCards.ContainsKey(id))
                .Select(id => existingCards[id])
                .ToList();

            await _boardNotificationService.BroadcastCardsReordered(
                boardId, columnId, cardIds,
                _mapper.Map<List<CardDto>>(orderedCards), userId
            );

            return true;
        }

        public async Task<bool> AssignMemberAsync(string cardId, string memberEmail, string userId)
        {
            var user = await _userManager.FindByEmailAsync(memberEmail);
            if (user == null)
                return false;

            var card = await _context.Cards
                .Include(c => c.Board)
                .Include(c => c.Column)
                .FirstOrDefaultAsync(c => c.Id == cardId);

            if (card == null)
                return false;

            var cardMember = new CardMember
            {
                Id = Guid.NewGuid().ToString(), CardId = cardId, UserId = user.Id, AssignedAt = DateTime.UtcNow
            };

            _context.CardMembers.Add(cardMember);
            await _context.SaveChangesAsync();

            var dto = _mapper.Map<CardDto>(card);

            await _boardNotificationService.BroadcastCardAssigned(
                card.BoardId,
                card.ColumnId,
                dto,
                user.Id,
                userId);

            var assigner = await _userManager.FindByIdAsync(userId);
            await _notificationService.CreateCardAssignedNotificationAsync(
                user.Id,
                assigner?.UserName ?? "Someone",
                card.Title,
                card.Board.Title,
                card.Id);

            return true;
        }

        public async Task<bool> UnassignMemberAsync(string cardId, string memberId, string userId)
        {
            var card = await _context.Cards
                .Include(c => c.Board)
                .Include(c => c.Column)
                .Include(c => c.Members)
                .FirstOrDefaultAsync(c => c.Id == cardId);

            if (card == null)
                return false;

            var cardMember = await _context.CardMembers
                .Include(cm => cm.User)
                .Include(cm => cm.Card)
                .ThenInclude(c => c.Column)
                .FirstOrDefaultAsync(cm => cm.Id == memberId && cm.CardId == cardId);

            if (cardMember == null)
                return false;

            _context.CardMembers.Remove(cardMember);
            await _context.SaveChangesAsync();

            var dto = _mapper.Map<CardDto>(card);

            await _boardNotificationService.BroadcastCardUnassigned(
                cardMember.Card.BoardId,
                cardMember.Card.ColumnId,
                dto,
                cardMember.UserId,
                userId);

            return true;
        }
    }
}