using ProjectManagement.Models.DTOs.Unplash;
using ProjectManagement.Services.Interfaces;
using StackExchange.Redis;
using System.Text.Json;

namespace ProjectManagement.Services
{
    public class UnsplashRedisCacheService : IUnsplashCacheService
    {
        private readonly IDatabase _db;
        private const string CACHE_KEY_PREFIX = "unsplash_";
        private const int CACHE_DURATION_HOURS = 24;

        public UnsplashRedisCacheService(IConnectionMultiplexer redis)
        {
            _db = redis.GetDatabase();
        }

        public async Task<List<UnsplashImageDto>> GetCachedImagesAsync(string query)
        {
            var key = $"{CACHE_KEY_PREFIX}{query.ToLower()}";
            var cached = await _db.StringGetAsync(key);

            if (cached.HasValue)
            {
                Console.WriteLine($"✅ Redis cache hit for: {query}");
                return JsonSerializer.Deserialize<List<UnsplashImageDto>>(cached.ToString());
            }

            return null;
        }

        public async Task SetCachedImagesAsync(string query, List<UnsplashImageDto> images)
        {
            var key = $"{CACHE_KEY_PREFIX}{query.ToLower()}";
            var json = JsonSerializer.Serialize(images);
            var expiry = TimeSpan.FromHours(CACHE_DURATION_HOURS);

            await _db.StringSetAsync(key, json, expiry);
            Console.WriteLine($"📝 Redis cache set for: {query}");
        }

        public async Task ClearCacheAsync()
        {
            var server = _db.Multiplexer.GetServer(_db.Multiplexer.GetEndPoints().First());
            await server.FlushDatabaseAsync();
            Console.WriteLine("🗑️ Redis cache cleared");
        }
    }
}