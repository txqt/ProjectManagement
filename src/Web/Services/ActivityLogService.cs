using AutoMapper;
using ProjectManagement.Data;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using ProjectManagement.Helpers;
using ProjectManagement.Hubs;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Activity;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Services
{
    public class ActivityLogService : IActivityLogService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IBoardNotificationService _boardNotificationService;
        private readonly ICacheService _cache;
        private readonly ICacheInvalidationService _cacheInvalidation;

        public ActivityLogService(
            ApplicationDbContext context,
            IMapper mapper, IBoardNotificationService boardNotificationService, ICacheService cache, ICacheInvalidationService cacheInvalidation)
        {
            _context = context;
            _mapper = mapper;
            _boardNotificationService = boardNotificationService;
            _cache = cache;
            _cacheInvalidation = cacheInvalidation;
        }

        public async Task<ActivityLogDto> LogActivityAsync(string userId, CreateActivityLogDto dto)
        {
            var activity = new ActivityLog
            {
                BoardId = dto.BoardId,
                CardId = dto.CardId,
                ColumnId = dto.ColumnId,
                UserId = userId,
                Action = dto.Action,
                EntityType = dto.EntityType,
                EntityId = dto.EntityId,
                Description = dto.Description,
                Metadata = dto.Metadata != null ? JsonConvert.SerializeObject(dto.Metadata) : null,
                CreatedAt = DateTime.UtcNow
            };

            _context.ActivityLogs.Add(activity);
            await _context.SaveChangesAsync();

            // Load related entities
            await _context.Entry(activity)
                .Reference(a => a.User)
                .LoadAsync();

            if (activity.CardId != null)
            {
                await _context.Entry(activity)
                    .Reference(a => a.Card)
                    .LoadAsync();
            }

            if (activity.ColumnId != null)
            {
                await _context.Entry(activity)
                    .Reference(a => a.Column)
                    .LoadAsync();
            }
            
            await _cache.RemoveByPatternAsync($"activity_summary:{dto.BoardId}:*");

            var activityDto = _mapper.Map<ActivityLogDto>(activity);
            
            await _cacheInvalidation.InvalidateActivitySummaryCacheAsync(dto.BoardId);

            // Broadcast to board group
            await _boardNotificationService.BroadcastActivityLogged(dto.BoardId, activityDto);

            return activityDto;
        }

        public async Task<List<ActivityLogDto>> GetBoardActivitiesAsync(string boardId, ActivityFilterDto filter)
        {
            var query = _context.ActivityLogs
                .Where(a => a.BoardId == boardId)
                .Include(a => a.User)
                .Include(a => a.Card)
                .Include(a => a.Column)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(filter.UserId))
            {
                query = query.Where(a => a.UserId == filter.UserId);
            }

            if (!string.IsNullOrEmpty(filter.EntityType))
            {
                query = query.Where(a => a.EntityType == filter.EntityType);
            }

            if (!string.IsNullOrEmpty(filter.Action))
            {
                query = query.Where(a => a.Action == filter.Action);
            }

            if (!string.IsNullOrEmpty(filter.CardId))
            {
                query = query.Where(a => a.CardId == filter.CardId);
            }

            if (!string.IsNullOrEmpty(filter.ColumnId))
            {
                query = query.Where(a => a.ColumnId == filter.ColumnId);
            }

            if (filter.FromDate.HasValue)
            {
                query = query.Where(a => a.CreatedAt >= filter.FromDate.Value);
            }

            if (filter.ToDate.HasValue)
            {
                query = query.Where(a => a.CreatedAt <= filter.ToDate.Value);
            }

            var activities = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip(filter.Skip)
                .Take(filter.Take)
                .ToListAsync();

            return _mapper.Map<List<ActivityLogDto>>(activities);
        }

        public async Task<List<ActivityLogDto>> GetCardActivitiesAsync(string boardId, string cardId, int skip = 0, int take = 50)
        {
            var activities = await _context.ActivityLogs
                .Where(a => a.BoardId == boardId && a.CardId == cardId)
                .Include(a => a.User)
                .Include(a => a.Card)
                .Include(a => a.Column)
                .OrderByDescending(a => a.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();

            return _mapper.Map<List<ActivityLogDto>>(activities);
        }

        public async Task<ActivitySummaryDto> GetActivitySummaryAsync(string boardId, int days = 7)
        {
            var cacheKey = CacheKeys.ActivitySummary(boardId, days);
            var cached = await _cache.GetAsync<ActivitySummaryDto>(cacheKey);
            if (cached != null)
            {
                Console.WriteLine($"✅ Cache hit for {cacheKey}");
                return cached;
            }

            var fromDate = DateTime.UtcNow.AddDays(-days);
            var today = DateTime.UtcNow.Date;
            var weekAgo = DateTime.UtcNow.AddDays(-7).Date;

            var activities = await _context.ActivityLogs
                .Where(a => a.BoardId == boardId && a.CreatedAt >= fromDate)
                .Include(a => a.User)
                .ToListAsync();

            var summary = new ActivitySummaryDto
            {
                TotalActivities = activities.Count,
                TodayActivities = activities.Count(a => a.CreatedAt.Date == today),
                ThisWeekActivities = activities.Count(a => a.CreatedAt.Date >= weekAgo),
                ActionCounts = activities
                    .GroupBy(a => a.Action)
                    .ToDictionary(g => g.Key, g => g.Count()),
                UserActivityCounts = activities
                    .GroupBy(a => a.User.UserName)
                    .ToDictionary(g => g.Key, g => g.Count()),
                RecentActivities = _mapper.Map<List<ActivityLogDto>>(
                    activities.OrderByDescending(a => a.CreatedAt).Take(20).ToList()
                )
            };

            await _cache.SetAsync(cacheKey, summary, TimeSpan.FromMinutes(10));
            Console.WriteLine($"📝 Cache set for {cacheKey}");

            return summary;
        }

        public async Task DeleteOldActivitiesAsync(int daysToKeep = 90)
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-daysToKeep);

            var oldActivities = await _context.ActivityLogs
                .Where(a => a.CreatedAt < cutoffDate)
                .ToListAsync();

            // Get unique board IDs để invalidate cache
            var affectedBoardIds = oldActivities.Select(a => a.BoardId).Distinct().ToList();

            _context.ActivityLogs.RemoveRange(oldActivities);
            await _context.SaveChangesAsync();

            // Invalidate activity summary cache cho các boards bị ảnh hưởng
            foreach (var boardId in affectedBoardIds)
            {
                await _cacheInvalidation.InvalidateActivitySummaryCacheAsync(boardId);
            }
        }
    }
}