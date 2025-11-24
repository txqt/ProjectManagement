using ProjectManagement.Services.Interfaces;
using Serilog;
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
        private readonly ILogger<RedisCacheService> _logger;

        public RedisCacheService(IConnectionMultiplexer connection, ILogger<RedisCacheService> logger)
        {
            _connection = connection;
            _logger = logger;
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
            try
            {
                var cached = await _db.StringGetAsync(key);
                if (!cached.HasValue) return default;
                return JsonSerializer.Deserialize<T>(cached!);
            }
            catch (RedisConnectionException ex)
            {
                _logger.LogWarning(ex, "Redis connection failed for key {Key}", key);
                return default; // Fail gracefully
            }
        }

        public async Task SetAsync<T>(string? key, T value, TimeSpan? expiry = null)
        {
            var actualKey = GenerateKey(key, value);
            var json = JsonSerializer.Serialize(value);
            var expiration = expiry ?? TimeSpan.FromHours(DEFAULT_EXPIRY_HOURS);

            await _db.StringSetAsync(actualKey, json, expiration);
            Log.Information($"📝 Cache set for: {actualKey}");
        }

        public async Task RemoveAsync(string key)
        {
            await _db.KeyDeleteAsync(key);
            Log.Information($"❌ Cache removed for: {key}");
        }

        public async Task ClearAsync()
        {
            var server = _connection.GetServer(_connection.GetEndPoints().First());
            await server.FlushDatabaseAsync();
            Log.Information("🗑️ All cache cleared");
        }
        
        public async Task RemoveByPatternAsync(string pattern)
        {
            var server = _connection.GetServer(_connection.GetEndPoints().First());
    
            var keys = server.KeysAsync(pattern: pattern);
            var batch = _db.CreateBatch();
            var tasks = new List<Task>();
    
            await foreach (var key in keys)
            {
                tasks.Add(batch.KeyDeleteAsync(key));
            }
    
            batch.Execute();
            await Task.WhenAll(tasks);
        }
    }
}