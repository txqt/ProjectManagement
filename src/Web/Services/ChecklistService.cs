using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Card;
using ProjectManagement.Models.DTOs.Checklist;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Services
{
    public class ChecklistService : IChecklistService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IPermissionService _permissionService;
        private readonly ICacheService _cache;
        private readonly  IBoardNotificationService _boardNotificationService;

        public ChecklistService(ApplicationDbContext context, IMapper mapper, IPermissionService permissionService, ICacheService cache, IBoardNotificationService boardNotificationService)
        {
            _context = context;
            _mapper = mapper;
            _permissionService = permissionService;
            _cache = cache;
            _boardNotificationService = boardNotificationService;
        }

        public async Task<ChecklistDto> CreateChecklistAsync(string boardId, string columnId, string cardId, CreateChecklistDto createDto, string userId)
        {
            var (hasPermission, _) = await _permissionService.CheckBoardPermissionAsync(
                userId, boardId, Authorization.Permissions.Cards.Edit);

            if (!hasPermission)
                throw new UnauthorizedAccessException("No permission to create checklist");

            var card = await _context.Cards.FindAsync(cardId);
            if (card == null)
                throw new ArgumentException("Card not found");

            var maxPosition = await _context.Checklists
                .Where(c => c.CardId == cardId)
                .MaxAsync(c => (int?)c.Position) ?? -1;

            var checklist = _mapper.Map<Checklist>(createDto);
            checklist.CardId = cardId;
            checklist.Position = maxPosition + 1;

            _context.Checklists.Add(checklist);
            await _context.SaveChangesAsync();

            var dto = _mapper.Map<ChecklistDto>(checklist);
            
            await InvalidateBoardCache(boardId);

            await _boardNotificationService.BroadcastChecklistCreated(boardId, columnId, cardId, dto, userId);
            
            return dto;
        }

        public async Task<ChecklistDto?> UpdateChecklistAsync(string checklistId, UpdateChecklistDto updateDto, string userId)
        {
            var checklist = await _context.Checklists
                .Include(c => c.Card)
                .FirstOrDefaultAsync(c => c.Id == checklistId);

            if (checklist == null) return null;

            var (hasPermission, _) = await _permissionService.CheckBoardPermissionAsync(
                userId, checklist.Card.BoardId, Authorization.Permissions.Cards.Edit);

            if (!hasPermission)
                throw new UnauthorizedAccessException("No permission to update checklist");

            _mapper.Map(updateDto, checklist);
            checklist.LastModified = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var dto = _mapper.Map<ChecklistDto>(checklist);
            var card = checklist.Card;
            
            await InvalidateBoardCache(card.BoardId);
            
            await _boardNotificationService.BroadcastChecklistUpdated(card.BoardId, card.ColumnId, card.Id, dto, userId);

            return dto;
        }

        public async Task<bool> DeleteChecklistAsync(string checklistId, string userId)
        {
            var checklist = await _context.Checklists
                .Include(c => c.Card)
                .FirstOrDefaultAsync(c => c.Id == checklistId);

            if (checklist == null) return false;

            var (hasPermission, _) = await _permissionService.CheckBoardPermissionAsync(
                userId, checklist.Card.BoardId, Authorization.Permissions.Cards.Edit);

            if (!hasPermission)
                throw new UnauthorizedAccessException("No permission to delete checklist");

            _context.Checklists.Remove(checklist);
            await _context.SaveChangesAsync();

            var card = checklist.Card;
            
            await InvalidateBoardCache(card.BoardId);
            
            await _boardNotificationService.BroadcastChecklistDeleted(card.BoardId, card.ColumnId, card.Id, checklistId, userId);

            return true;
        }

        public async Task<ChecklistItemDto> CreateChecklistItemAsync(string checklistId, CreateChecklistItemDto createDto, string userId)
        {
            var checklist = await _context.Checklists
                .Include(c => c.Card)
                .FirstOrDefaultAsync(c => c.Id == checklistId);

            if (checklist == null)
                throw new ArgumentException("Checklist not found");

            var (hasPermission, _) = await _permissionService.CheckBoardPermissionAsync(
                userId, checklist.Card.BoardId, Authorization.Permissions.Cards.Edit);

            if (!hasPermission)
                throw new UnauthorizedAccessException("No permission to create checklist item");

            var maxPosition = await _context.ChecklistItems
                .Where(i => i.ChecklistId == checklistId)
                .MaxAsync(i => (int?)i.Position) ?? -1;

            var item = _mapper.Map<ChecklistItem>(createDto);
            item.ChecklistId = checklistId;
            item.Position = maxPosition + 1;

            _context.ChecklistItems.Add(item);
            await _context.SaveChangesAsync();
            
            var boardId = checklist.Card.BoardId;
            await InvalidateBoardCache(boardId);
            
            var card = checklist.Card;

            var dto = _mapper.Map<ChecklistItemDto>(item);
            
            await _boardNotificationService.BroadcastChecklistItemCreated(boardId, card.ColumnId, card.Id, checklistId, dto, userId);

            return dto;
        }

        public async Task<ChecklistItemDto?> UpdateChecklistItemAsync(string itemId, UpdateChecklistItemDto updateDto, string userId)
        {
            var item = await _context.ChecklistItems
                .Include(i => i.Checklist)
                .ThenInclude(c => c.Card)
                .FirstOrDefaultAsync(i => i.Id == itemId);

            if (item == null) return null;

            var (hasPermission, _) = await _permissionService.CheckBoardPermissionAsync(
                userId, item.Checklist.Card.BoardId, Authorization.Permissions.Cards.Edit);

            if (!hasPermission)
                throw new UnauthorizedAccessException("No permission to update checklist item");

            _mapper.Map(updateDto, item);
            
            if (updateDto.IsCompleted.HasValue && updateDto.IsCompleted.Value != item.IsCompleted)
            {
                item.IsCompleted = updateDto.IsCompleted.Value;
                item.CompletedAt = item.IsCompleted ? DateTime.UtcNow : null;
                item.CompletedBy = item.IsCompleted ? userId : null;
            }

            item.LastModified = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var dto = _mapper.Map<ChecklistItemDto>(item);
            var card =  item.Checklist.Card;
            
            await InvalidateBoardCache(card.BoardId);
            
            await _boardNotificationService.BroadcastChecklistItemUpdated(card.BoardId, card.Id, card.Id, item.ChecklistId, dto, userId);

            return dto;
        }

        public async Task<bool> DeleteChecklistItemAsync(string itemId, string userId)
        {
            var item = await _context.ChecklistItems
                .Include(i => i.Checklist)
                .ThenInclude(c => c.Card)
                .FirstOrDefaultAsync(i => i.Id == itemId);

            if (item == null) return false;

            var (hasPermission, _) = await _permissionService.CheckBoardPermissionAsync(
                userId, item.Checklist.Card.BoardId, Authorization.Permissions.Cards.Edit);

            if (!hasPermission)
                throw new UnauthorizedAccessException("No permission to delete checklist item");

            _context.ChecklistItems.Remove(item);
            await _context.SaveChangesAsync();
            
            var boardId = item.Checklist.Card.BoardId;
            await InvalidateBoardCache(boardId);

            var card = item.Checklist.Card;
            // Broadcast via SignalR
            await _boardNotificationService.BroadcastChecklistItemDeleted(boardId, card.ColumnId, card.Id, item.ChecklistId, itemId, userId);

            return true;
        }

        public async Task<bool> ToggleChecklistItemAsync(string itemId, string userId)
        {
            var item = await _context.ChecklistItems
                .Include(i => i.Checklist)
                .ThenInclude(c => c.Card)
                .FirstOrDefaultAsync(i => i.Id == itemId);

            if (item == null) return false;

            var card = await _context.Cards
                .Include(c => c.Checklists)
                .ThenInclude(cl => cl.Items)
                .FirstOrDefaultAsync(c => c.Id == item.Checklist.CardId);

            var (hasPermission, _) = await _permissionService.CheckBoardPermissionAsync(
                userId, card.BoardId, Authorization.Permissions.Cards.Edit);

            if (!hasPermission)
                throw new UnauthorizedAccessException("No permission to toggle checklist item");

            item.IsCompleted = !item.IsCompleted;
            item.CompletedAt = item.IsCompleted ? DateTime.UtcNow : null;
            item.CompletedBy = item.IsCompleted ? userId : null;
            item.LastModified = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Map card đã load đủ
            var cardDto = _mapper.Map<CardDto>(card);
            
            var checkListItemDto = _mapper.Map<ChecklistItemDto>(item);

            await _boardNotificationService.BroadcastChecklistItemToggled(cardDto.BoardId, cardDto.ColumnId, cardDto.Id, item.ChecklistId, checkListItemDto, userId);

            await InvalidateBoardCache(cardDto.BoardId);

            return true;
        }
        
        private async Task InvalidateBoardCache(string boardId)
        {
            var cacheKey = $"board:{boardId}";
            await _cache.RemoveAsync(cacheKey);
        }
    }
}