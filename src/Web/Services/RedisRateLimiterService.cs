using ProjectManagement.Models.DTOs.RateLimit;
using ProjectManagement.Services.Interfaces;
using StackExchange.Redis;

namespace ProjectManagement.Services
{
    public class RedisRateLimiterService : IRateLimiterService
    {
        private readonly IDatabase _db;
        private readonly ILogger<RedisRateLimiterService> _logger;

        public RedisRateLimiterService(
            IConnectionMultiplexer redis,
            ILogger<RedisRateLimiterService> logger)
        {
            _db = redis.GetDatabase();
            _logger = logger;
        }

        public async Task<RateLimitResult> CheckRateLimitAsync(
            string identifier,
            string endpoint,
            RateLimitPolicy policy)
        {
            try
            {
                // Check minute limit
                var minuteResult = await CheckWindowAsync(
                    identifier,
                    endpoint,
                    "minute",
                    policy.RequestsPerMinute,
                    TimeSpan.FromMinutes(1));

                if (!minuteResult.IsAllowed)
                    return minuteResult;

                // Check hour limit
                var hourResult = await CheckWindowAsync(
                    identifier,
                    endpoint,
                    "hour",
                    policy.RequestsPerHour,
                    TimeSpan.FromHours(1));

                return hourResult;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Rate limit check failed for {Identifier} at {Endpoint}",
                    identifier, endpoint);

                // Fail open: cho phép request nếu Redis lỗi
                return new RateLimitResult
                {
                    IsAllowed = true, RemainingRequests = -1, Message = "Rate limiting unavailable"
                };
            }
        }

        private async Task<RateLimitResult> CheckWindowAsync(
            string identifier,
            string endpoint,
            string window,
            int maxRequests,
            TimeSpan duration)
        {
            var key = $"ratelimit:{window}:{identifier}:{endpoint}";
            var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var windowStart = now - (long)duration.TotalSeconds;

            var transaction = _db.CreateTransaction();

            // Xóa requests cũ ngoài window
            transaction.SortedSetRemoveRangeByScoreAsync(key, 0, windowStart);

            // Thêm request hiện tại
            transaction.SortedSetAddAsync(key, now, now);

            // Set TTL
            transaction.KeyExpireAsync(key, duration);

            await transaction.ExecuteAsync();

            // Đếm requests trong window
            var count = await _db.SortedSetLengthAsync(key);

            if (count > maxRequests)
            {
                var oldestRequest = await _db.SortedSetRangeByScoreAsync(
                    key,
                    start: double.NegativeInfinity,
                    stop: double.PositiveInfinity,
                    order: Order.Ascending,
                    skip: 0,
                    take: 1
                );
                
                var retryAfter = oldestRequest.Length > 0
                    ? (int)(duration.TotalSeconds - (now - (long)oldestRequest[0]))
                    : (int)duration.TotalSeconds;

                return new RateLimitResult
                {
                    IsAllowed = false,
                    RemainingRequests = 0,
                    RetryAfterSeconds = retryAfter,
                    Message = $"Rate limit exceeded: {count}/{maxRequests} requests per {window}"
                };
            }

            return new RateLimitResult
            {
                IsAllowed = true,
                RemainingRequests = maxRequests - (int)count,
                RetryAfterSeconds = 0,
                Message = "OK"
            };
        }

        public async Task ResetLimitAsync(string identifier)
        {
            var server = _db.Multiplexer.GetServer(
                _db.Multiplexer.GetEndPoints().First());

            var keys = server.Keys(pattern: $"ratelimit:*:{identifier}:*");

            foreach (var key in keys)
            {
                await _db.KeyDeleteAsync(key);
            }
        }
    }
}