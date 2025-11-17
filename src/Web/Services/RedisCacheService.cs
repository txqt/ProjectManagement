using ProjectManagement.Services.Interfaces;
using StackExchange.Redis;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace ProjectManagement.Services
{
    public class RedisCacheService : ICacheService
    {
        private readonly IDatabase _db;
        private readonly IConnectionMultiplexer _connection;
        private const int DEFAULT_EXPIRY_HOURS = 24;

        public RedisCacheService(IConnectionMultiplexer connection)
        {
            _connection = connection;
            _db = connection.GetDatabase();
        }

        private static string GenerateKey<T>(string? key, T value)
        {
            if (!string.IsNullOrWhiteSpace(key))
                return key;

            string json = JsonSerializer.Serialize(value);
            string hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(json)));
            string typeName = typeof(T).Name;

            return $"{typeName}:{hash[..16]}";
        }

        public async Task<T?> GetAsync<T>(string key)
        {
            if (string.IsNullOrWhiteSpace(key))
                throw new ArgumentException("Cache key cannot be null or empty when calling GetAsync.");

            var cached = await _db.StringGetAsync(key);
            if (!cached.HasValue) return default;

            Console.WriteLine($"✅ Cache hit for: {key}");
            return JsonSerializer.Deserialize<T>(cached!);
        }

        public async Task SetAsync<T>(string? key, T value, TimeSpan? expiry = null)
        {
            var actualKey = GenerateKey(key, value);
            var json = JsonSerializer.Serialize(value);
            var expiration = expiry ?? TimeSpan.FromHours(DEFAULT_EXPIRY_HOURS);

            await _db.StringSetAsync(actualKey, json, expiration);
            Console.WriteLine($"📝 Cache set for: {actualKey}");
        }

        public async Task RemoveAsync(string key)
        {
            await _db.KeyDeleteAsync(key);
            Console.WriteLine($"❌ Cache removed for: {key}");
        }

        public async Task ClearAsync()
        {
            var server = _connection.GetServer(_connection.GetEndPoints().First());
            await server.FlushDatabaseAsync();
            Console.WriteLine("🗑️ All cache cleared");
        }
        
        public async Task RemoveByPatternAsync(string pattern)
        {
            // pattern like "user_boards:123:*"
            var server = _connection.GetServer(_connection.GetEndPoints().First());
            var keys = server.Keys(pattern: pattern);
            var ids = keys.Select(k => (RedisKey)k).ToArray();
            if (ids.Length > 0) await _db.KeyDeleteAsync(ids);
        }
    }
}