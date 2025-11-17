using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Helpers;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Services
{
    public class CacheInvalidationService : ICacheInvalidationService
    {
        private readonly ICacheService _cache;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CacheInvalidationService> _logger;

        public CacheInvalidationService(
            ICacheService cache,
            ApplicationDbContext context,
            ILogger<CacheInvalidationService> logger)
        {
            _cache = cache;
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Invalidate tất cả cache liên quan đến board
        /// </summary>
        public async Task InvalidateBoardCachesAsync(string boardId)
        {
            try
            {
                _logger.LogInformation("Invalidating board caches for boardId: {BoardId}", boardId);

                // 1. Remove board cache
                await _cache.RemoveAsync(CacheKeys.Board(boardId));

                // 2. Load board với members để invalidate user boards cache
                var board = await _context.Boards
                    .Include(b => b.Members)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(b => b.Id == boardId);

                if (board == null)
                {
                    _logger.LogWarning("Board {BoardId} not found for cache invalidation", boardId);
                    return;
                }

                // 3. Invalidate owner's user boards cache
                await _cache.RemoveByPatternAsync(CacheKeys.UserBoardsPattern(board.OwnerId));

                // 4. Invalidate all members' user boards cache
                foreach (var member in board.Members)
                {
                    await _cache.RemoveByPatternAsync(CacheKeys.UserBoardsPattern(member.UserId));
                }

                // 5. Invalidate board invites cache
                await _cache.RemoveByPatternAsync(CacheKeys.BoardInvitesPattern(boardId));

                // 6. Invalidate board join requests cache
                await _cache.RemoveByPatternAsync(CacheKeys.BoardJoinRequestsPattern(boardId));

                // 7. Invalidate activity summary cache (all variations)
                for (int days = 1; days <= 30; days++)
                {
                    await _cache.RemoveAsync(CacheKeys.ActivitySummary(boardId, days));
                }

                // 8. Invalidate share token cache
                await _cache.RemoveAsync(CacheKeys.ActiveShareToken(boardId));

                _logger.LogInformation("Successfully invalidated board caches for boardId: {BoardId}", boardId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating board caches for boardId: {BoardId}", boardId);
                // Don't throw - cache invalidation failure shouldn't break the operation
            }
        }

        /// <summary>
        /// Invalidate cache cho một user cụ thể (khi user được thêm/xóa khỏi board)
        /// </summary>
        public async Task InvalidateUserBoardsCacheAsync(string userId)
        {
            try
            {
                _logger.LogInformation("Invalidating user boards cache for userId: {UserId}", userId);
                await _cache.RemoveByPatternAsync(CacheKeys.UserBoardsPattern(userId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating user boards cache for userId: {UserId}", userId);
            }
        }

        /// <summary>
        /// Invalidate cache khi có thay đổi về card (create/update/delete/move)
        /// </summary>
        public async Task InvalidateCardCachesAsync(string cardId, string boardId)
        {
            try
            {
                _logger.LogInformation("Invalidating card caches for cardId: {CardId}, boardId: {BoardId}", 
                    cardId, boardId);

                // 1. Remove attachments cache
                await _cache.RemoveAsync(CacheKeys.Attachments(cardId));

                // 2. Invalidate board caches (board data changed)
                await InvalidateBoardCachesAsync(boardId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating card caches for cardId: {CardId}", cardId);
            }
        }

        /// <summary>
        /// Invalidate cache khi có thay đổi về column (create/update/delete/reorder)
        /// </summary>
        public async Task InvalidateColumnCachesAsync(string columnId, string boardId)
        {
            try
            {
                _logger.LogInformation("Invalidating column caches for columnId: {ColumnId}, boardId: {BoardId}", 
                    columnId, boardId);

                // Column changes affect board structure
                await InvalidateBoardCachesAsync(boardId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating column caches for columnId: {ColumnId}", columnId);
            }
        }

        /// <summary>
        /// Invalidate cache khi có thay đổi về attachments
        /// </summary>
        public async Task InvalidateAttachmentCachesAsync(string cardId, string boardId)
        {
            try
            {
                _logger.LogInformation("Invalidating attachment caches for cardId: {CardId}", cardId);

                // Remove attachments cache
                await _cache.RemoveAsync(CacheKeys.Attachments(cardId));

                // Board cache cũng cần invalidate vì board DTO include attachments
                await InvalidateBoardCachesAsync(boardId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating attachment caches for cardId: {CardId}", cardId);
            }
        }

        /// <summary>
        /// Invalidate cache khi có thay đổi về comments
        /// </summary>
        public async Task InvalidateCommentCachesAsync(string cardId, string boardId)
        {
            try
            {
                _logger.LogInformation("Invalidating comment caches for cardId: {CardId}", cardId);

                // Board cache cần invalidate vì board DTO include comments
                await InvalidateBoardCachesAsync(boardId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating comment caches for cardId: {CardId}", cardId);
            }
        }

        /// <summary>
        /// Invalidate cache khi có thay đổi về checklists
        /// </summary>
        public async Task InvalidateChecklistCachesAsync(string cardId, string boardId)
        {
            try
            {
                _logger.LogInformation("Invalidating checklist caches for cardId: {CardId}", cardId);

                // Board cache cần invalidate vì board DTO include checklists
                await InvalidateBoardCachesAsync(boardId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating checklist caches for cardId: {CardId}", cardId);
            }
        }

        /// <summary>
        /// Invalidate cache khi có thay đổi về labels
        /// </summary>
        public async Task InvalidateLabelCachesAsync(string boardId)
        {
            try
            {
                _logger.LogInformation("Invalidating label caches for boardId: {BoardId}", boardId);
                
                await _cache.RemoveAsync(CacheKeys.Labels(boardId));

                // Board cache cần invalidate vì board DTO include labels
                await InvalidateBoardCachesAsync(boardId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating label caches for boardId: {BoardId}", boardId);
            }
        }

        /// <summary>
        /// Invalidate notification caches cho một user
        /// </summary>
        public async Task InvalidateNotificationCachesAsync(string userId)
        {
            try
            {
                _logger.LogInformation("Invalidating notification caches for userId: {UserId}", userId);

                // Remove notification summary
                await _cache.RemoveAsync(CacheKeys.NotificationSummary(userId));

                // Remove all notification list caches
                await _cache.RemoveByPatternAsync(CacheKeys.NotificationsPattern(userId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating notification caches for userId: {UserId}", userId);
            }
        }

        /// <summary>
        /// Invalidate board invites cache
        /// </summary>
        public async Task InvalidateBoardInvitesCacheAsync(string boardId)
        {
            try
            {
                _logger.LogInformation("Invalidating board invites cache for boardId: {BoardId}", boardId);
                await _cache.RemoveByPatternAsync(CacheKeys.BoardInvitesPattern(boardId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating board invites cache for boardId: {BoardId}", boardId);
            }
        }

        /// <summary>
        /// Invalidate join requests cache
        /// </summary>
        public async Task InvalidateJoinRequestsCacheAsync(string boardId)
        {
            try
            {
                _logger.LogInformation("Invalidating join requests cache for boardId: {BoardId}", boardId);
                await _cache.RemoveByPatternAsync(CacheKeys.BoardJoinRequestsPattern(boardId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating join requests cache for boardId: {BoardId}", boardId);
            }
        }

        /// <summary>
        /// Invalidate activity summary cache
        /// </summary>
        public async Task InvalidateActivitySummaryCacheAsync(string boardId, int? specificDays = null)
        {
            try
            {
                if (specificDays.HasValue)
                {
                    await _cache.RemoveAsync(CacheKeys.ActivitySummary(boardId, specificDays.Value));
                }
                else
                {
                    // Invalidate common day ranges
                    var commonDays = new[] { 1, 7, 14, 30 };
                    foreach (var days in commonDays)
                    {
                        await _cache.RemoveAsync(CacheKeys.ActivitySummary(boardId, days));
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating activity summary cache for boardId: {BoardId}", boardId);
            }
        }

        /// <summary>
        /// Invalidate tất cả cache liên quan đến multiple users (dùng khi có bulk operations)
        /// </summary>
        public async Task InvalidateMultipleUsersCacheAsync(IEnumerable<string> userIds)
        {
            try
            {
                foreach (var userId in userIds)
                {
                    await InvalidateUserBoardsCacheAsync(userId);
                    await InvalidateNotificationCachesAsync(userId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating multiple users cache");
            }
        }
    }
}