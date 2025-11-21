using AutoMapper;
using ProjectManagement.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Board;
using ProjectManagement.Models.DTOs.Card;
using ProjectManagement.Services.Interfaces;
using LexoAlgorithm;
using ProjectManagement.Helpers;

namespace ProjectManagement.Services
{
    public class CardService : ICardService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IBoardNotificationService _boardNotificationService;
        private readonly INotificationService _notificationService;
        private readonly IActivityLogService _activityLogService;
        private readonly ICacheInvalidationService _cacheInvalidation;

        public CardService(
            ApplicationDbContext context,
            IMapper mapper,
            UserManager<ApplicationUser> userManager,
            IBoardNotificationService boardNotificationService,
            INotificationService notificationService, IActivityLogService activityLogService,
            ICacheInvalidationService cacheInvalidation)
        {
            _context = context;
            _mapper = mapper;
            _userManager = userManager;
            _boardNotificationService = boardNotificationService;
            _notificationService = notificationService;
            _activityLogService = activityLogService;
            _cacheInvalidation = cacheInvalidation;
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
                .Include(c => c.Checklists)
                .ThenInclude(cl => cl.Items)
                .Include(c => c.Labels)
                .ThenInclude(cl => cl.Label)
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

            await ActivityLogger.LogCardCreatedAsync(
                _activityLogService,
                userId,
                card.BoardId,
                columnId,
                card.Id,
                card.Title
            );

            var createdCard = await GetCardAsync(card.Id);

            await _cacheInvalidation.InvalidateCardCachesAsync(card.Id, card.BoardId);

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

            if (updateCardDto.Cover == null)
            {
                card.Cover = null;
            }

            var changes = new Dictionary<string, object>();
            if (updateCardDto.Title != null && updateCardDto.Title != card.Title)
            {
                changes["title"] = new { from = card.Title, to = updateCardDto.Title };
                card.Title = updateCardDto.Title;
            }

            if (updateCardDto.Description != null && updateCardDto.Description != card.Description)
            {
                changes["description"] = "updated";
                card.Description = updateCardDto.Description;
            }

            await _context.SaveChangesAsync();

            if (changes.Count > 0)
            {
                await ActivityLogger.LogCardUpdatedAsync(
                    _activityLogService,
                    userId,
                    card.BoardId,
                    card.ColumnId,
                    cardId,
                    card.Title,
                    changes
                );
            }

            var updatedCard = await GetCardAsync(cardId);
            await _boardNotificationService.BroadcastCardUpdated(card.BoardId, card.ColumnId, updatedCard, userId);

            await _cacheInvalidation.InvalidateCardCachesAsync(cardId, card.BoardId);

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

            await _cacheInvalidation.InvalidateCardCachesAsync(cardId, card.BoardId);

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

            var fromColumn = await _context.Columns.FirstOrDefaultAsync(c => c.Id == card.ColumnId);
            var toColumn = destinationColumn;

            string oldColumnId = card.ColumnId;

            // Calculate new rank based on position
            var cardsInDestColumn = toColumn.Cards
                .Where(c => c.Id != cardId) // loại card hiện tại nếu cùng column
                .OrderBy(c => c.Rank)
                .ToList();

            string newRank;

            if (moveCardDto.NewIndex >= cardsInDestColumn.Count)
            {
                var lastCard = cardsInDestColumn.LastOrDefault();
                newRank = lastCard != null
                    ? LexoRank.Parse(lastCard.Rank).GenNext().ToString()
                    : LexoRank.Middle().ToString();
            }
            else if (moveCardDto.NewIndex == 0)
            {
                var firstCard = cardsInDestColumn.FirstOrDefault();
                newRank = firstCard != null
                    ? LexoRank.Parse(firstCard.Rank).GenPrev().ToString()
                    : LexoRank.Middle().ToString();
            }
            else
            {
                var prevCard = cardsInDestColumn[moveCardDto.NewIndex - 1];
                var nextCard = cardsInDestColumn[moveCardDto.NewIndex];
                var prevRank = LexoRank.Parse(prevCard.Rank);
                var nextRank = LexoRank.Parse(nextCard.Rank);
                newRank = prevRank.Between(nextRank).ToString();
            }

            card.Rank = newRank;
            card.ColumnId = moveCardDto.ToColumnId;
            card.LastModified = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await ActivityLogger.LogCardMovedAsync(
                _activityLogService,
                userId,
                card.BoardId,
                cardId,
                card.Title,
                oldColumnId,
                fromColumn?.Title ?? "",
                moveCardDto.ToColumnId,
                toColumn?.Title ?? ""
            );

            var dto = _mapper.Map<CardDto>(card);
            await _cacheInvalidation.InvalidateCardCachesAsync(cardId, card.BoardId);
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

            await _cacheInvalidation.InvalidateBoardCachesAsync(boardId);

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
                .Include(c => c.Members)
                .Include(c => c.Labels)
                .ThenInclude(cl => cl.Label)
                .Include(c => c.Checklists)
                .ThenInclude(c => c.Items)
                .Include(c=>c.Attachments)
                .Include(c=>c.Comments)
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

            await ActivityLogger.LogMemberAssignedAsync(
                _activityLogService,
                userId,
                dto.BoardId,
                dto.ColumnId,
                cardId,
                card.Title,
                user.UserName
            );

            await _boardNotificationService.BroadcastCardAssigned(
                card.BoardId,
                card.ColumnId,
                dto,
                user.Id,
                userId);

            await _cacheInvalidation.InvalidateCardCachesAsync(cardId, card.BoardId);

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
                .Include(c => c.Labels)
                .ThenInclude(cl => cl.Label)
                .Include(c => c.Checklists)
                .ThenInclude(c => c.Items)
                .Include(c=>c.Attachments)
                .Include(c=>c.Comments)
                .FirstOrDefaultAsync(c => c.Id == cardId);

            if (card == null)
                return false;

            var cardMember = await _context.CardMembers
                .Include(cm => cm.User)
                .Include(cm => cm.Card)
                .ThenInclude(c => c.Column)
                .FirstOrDefaultAsync(cm => cm.UserId == memberId && cm.CardId == cardId);

            if (cardMember == null)
                return false;

            _context.CardMembers.Remove(cardMember);
            await _context.SaveChangesAsync();

            var dto = _mapper.Map<CardDto>(card);

            await _cacheInvalidation.InvalidateCardCachesAsync(cardId, card.BoardId);

            await _boardNotificationService.BroadcastCardUnassigned(
                cardMember.Card.BoardId,
                cardMember.Card.ColumnId,
                dto,
                cardMember.UserId,
                userId);

            return true;
        }

        public async Task<CardDto> CloneCardAsync(
            string columnId,
            string cardId,
            CloneCardDto cloneDto,
            string userId)
        {
            var sourceCard = await _context.Cards
                .Include(c => c.Members)
                .Include(c => c.Labels)
                .ThenInclude(cl => cl.Label)
                .Include(c => c.Checklists)
                .ThenInclude(checklist => checklist.Items)
                .Include(c => c.Comments)
                .Include(c => c.Attachments)
                .FirstOrDefaultAsync(c => c.Id == cardId);

            if (sourceCard == null)
                throw new ArgumentException("Card not found");

            // Get last card rank in column
            var column = await _context.Columns
                .Include(c => c.Cards)
                .FirstOrDefaultAsync(c => c.Id == columnId);

            if (column == null)
                throw new ArgumentException("Column not found");

            var lastCard = column.Cards.OrderByDescending(c => c.Rank).FirstOrDefault();
            var newRank = lastCard != null
                ? LexoRank.Parse(lastCard.Rank).GenNext().ToString()
                : LexoRank.Middle().ToString();

            var newCard = new Card
            {
                Id = Guid.NewGuid().ToString(),
                BoardId = sourceCard.BoardId,
                ColumnId = columnId,
                Title = cloneDto.Title,
                Description = sourceCard.Description,
                Cover = sourceCard.Cover,
                Rank = newRank,
                CreatedAt = DateTime.UtcNow,
                LastModified = DateTime.UtcNow
            };

            _context.Cards.Add(newCard);

            // Clone members if requested
            if (cloneDto.IncludeMembers)
            {
                foreach (var member in sourceCard.Members)
                {
                    _context.CardMembers.Add(new CardMember
                    {
                        Id = Guid.NewGuid().ToString(),
                        CardId = newCard.Id,
                        UserId = member.UserId,
                        AssignedAt = DateTime.UtcNow
                    });
                }
            }

            // Clone labels if requested
            if (cloneDto.IncludeLabels)
            {
                foreach (var cardLabel in sourceCard.Labels)
                {
                    _context.CardLabels.Add(new CardLabel
                    {
                        Id = Guid.NewGuid().ToString(), CardId = newCard.Id, LabelId = cardLabel.LabelId
                    });
                }
            }

            // Clone checklists if requested
            if (cloneDto.IncludeChecklists)
            {
                foreach (var sourceChecklist in sourceCard.Checklists)
                {
                    var newChecklist = new Checklist
                    {
                        Id = Guid.NewGuid().ToString(),
                        CardId = newCard.Id,
                        Title = sourceChecklist.Title,
                        Position = sourceChecklist.Position
                    };

                    _context.Checklists.Add(newChecklist);

                    foreach (var sourceItem in sourceChecklist.Items)
                    {
                        _context.ChecklistItems.Add(new ChecklistItem
                        {
                            Id = Guid.NewGuid().ToString(),
                            ChecklistId = newChecklist.Id,
                            Title = sourceItem.Title,
                            IsCompleted = false,
                            Position = sourceItem.Position
                        });
                    }
                }
            }

            // Clone comments if requested
            if (cloneDto.IncludeComments)
            {
                foreach (var comment in sourceCard.Comments)
                {
                    _context.Comments.Add(new Comment
                    {
                        Id = Guid.NewGuid().ToString(),
                        CardId = newCard.Id,
                        UserId = comment.UserId,
                        Content = comment.Content,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            // Clone attachments if requested (URLs only, not actual files)
            if (cloneDto.IncludeAttachments)
            {
                foreach (var attachment in sourceCard.Attachments)
                {
                    _context.Attachments.Add(new Attachment
                    {
                        Id = Guid.NewGuid().ToString(),
                        CardId = newCard.Id,
                        Name = $"Copy of {attachment.Name}",
                        Url = attachment.Url,
                        Type = attachment.Type,
                    });
                }
            }

            await _context.SaveChangesAsync();
            await _cacheInvalidation.InvalidateCardCachesAsync(newCard.Id, sourceCard.BoardId);

            return await GetCardAsync(newCard.Id);
        }
    }
}