using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Helpers;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Label;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Services
{
    public class LabelService : ILabelService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IPermissionService _permissionService;
        private readonly ICacheService _cache;
        private readonly ICacheInvalidationService _cacheInvalidation;

        public LabelService(ApplicationDbContext context, IMapper mapper, IPermissionService permissionService, ICacheService cache, ICacheInvalidationService cacheInvalidation)
        {
            _context = context;
            _mapper = mapper;
            _permissionService = permissionService;
            _cache = cache;
            _cacheInvalidation = cacheInvalidation;
        }

        public async Task<List<LabelDto>> GetBoardLabelsAsync(string boardId)
        {
            var cacheKey = CacheKeys.Labels(boardId);
            var cached = await _cache.GetAsync<List<LabelDto>>(cacheKey);
            if (cached != null) return cached;
            
            var labels = await _context.Labels
                .Where(l => l.BoardId == boardId)
                .OrderBy(l => l.Title)
                .ToListAsync();
            
            var dtos = _mapper.Map<List<LabelDto>>(labels);
            
            await _cache.SetAsync(cacheKey, dtos, TimeSpan.FromMinutes(5));

            return dtos;
        }

        public async Task<LabelDto> CreateLabelAsync(string boardId, CreateLabelDto createDto, string userId)
        {
            var (hasPermission, _) = await _permissionService.CheckBoardPermissionAsync(
                userId, boardId, Authorization.Permissions.Boards.Edit);

            if (!hasPermission)
                throw new UnauthorizedAccessException("No permission to create labels");

            var label = _mapper.Map<Label>(createDto);
            label.BoardId = boardId;

            _context.Labels.Add(label);
            await _context.SaveChangesAsync();
            
            await _cacheInvalidation.InvalidateLabelCachesAsync(boardId);

            return _mapper.Map<LabelDto>(label);
        }

        public async Task<LabelDto?> UpdateLabelAsync(string labelId, UpdateLabelDto updateDto, string userId)
        {
            var label = await _context.Labels.FindAsync(labelId);
            if (label == null) return null;

            var (hasPermission, _) = await _permissionService.CheckBoardPermissionAsync(
                userId, label.BoardId, Authorization.Permissions.Boards.Edit);

            if (!hasPermission)
                throw new UnauthorizedAccessException("No permission to update labels");

            _mapper.Map(updateDto, label);
            await _context.SaveChangesAsync();
            
            await _cacheInvalidation.InvalidateLabelCachesAsync(label.BoardId);

            return _mapper.Map<LabelDto>(label);
        }

        public async Task<bool> DeleteLabelAsync(string labelId, string userId)
        {
            var label = await _context.Labels.FindAsync(labelId);
            if (label == null) return false;

            var (hasPermission, _) = await _permissionService.CheckBoardPermissionAsync(
                userId, label.BoardId, Authorization.Permissions.Boards.Edit);

            if (!hasPermission)
                throw new UnauthorizedAccessException("No permission to delete labels");

            _context.Labels.Remove(label);
            await _context.SaveChangesAsync();
            
            await _cacheInvalidation.InvalidateLabelCachesAsync(label.BoardId);

            return true;
        }

        public async Task<bool> AddLabelToCardAsync(string boardId, string columnId, string cardId, string labelId, string userId)
        {
            var (hasPermission, _) = await _permissionService.CheckBoardPermissionAsync(
                userId, boardId, Authorization.Permissions.Cards.Edit);

            if (!hasPermission)
                throw new UnauthorizedAccessException("No permission to add labels to card");

            var card = await _context.Cards.FindAsync(cardId);
            var label = await _context.Labels.FindAsync(labelId);

            if (card == null || label == null || label.BoardId != boardId)
                return false;

            var existing = await _context.CardLabels
                .AnyAsync(cl => cl.CardId == cardId && cl.LabelId == labelId);

            if (existing) return true;

            _context.CardLabels.Add(new CardLabel
            {
                CardId = cardId,
                LabelId = labelId
            });

            await _context.SaveChangesAsync();
            
            await _cacheInvalidation.InvalidateLabelCachesAsync(boardId);
            
            return true;
        }

        public async Task<bool> RemoveLabelFromCardAsync(string boardId, string columnId, string cardId, string labelId, string userId)
        {
            var (hasPermission, _) = await _permissionService.CheckBoardPermissionAsync(
                userId, boardId, Authorization.Permissions.Cards.Edit);

            if (!hasPermission)
                throw new UnauthorizedAccessException("No permission to remove labels from card");

            var cardLabel = await _context.CardLabels
                .FirstOrDefaultAsync(cl => cl.CardId == cardId && cl.LabelId == labelId);

            if (cardLabel == null) return false;

            _context.CardLabels.Remove(cardLabel);
            await _context.SaveChangesAsync();

            await _cacheInvalidation.InvalidateLabelCachesAsync(boardId);
            
            return true;
        }
    }
}