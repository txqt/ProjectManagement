using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace ProjectManagement.Services
{
    public interface ITempTokenService
    {
        string GenerateTempToken(string userId);
        string ValidateTempToken(string token);
    }

    public class TempTokenService : ITempTokenService
    {
        private readonly ILogger<TempTokenService> _logger;
        private static readonly ConcurrentDictionary<string, (string userId, DateTime expiry)> _tokens = new();

        public TempTokenService(ILogger<TempTokenService> logger)
        {
            _logger = logger;
        }

        public string GenerateTempToken(string userId)
        {
            CleanupExpiredTokens();
            
            var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
            var expiry = DateTime.UtcNow.AddMinutes(5); // 5 minutes expiration
            
            _tokens[token] = (userId, expiry);
            
            _logger.LogInformation("Generated temp token for user {UserId}, expires at {Expiry}", userId, expiry);
            
            return token;
        }

        public string ValidateTempToken(string token)
        {
            if (_tokens.TryGetValue(token, out var data))
            {
                if (data.expiry > DateTime.UtcNow)
                {
                    // Remove token after use (one-time use)
                    _tokens.TryRemove(token, out _);
                    _logger.LogInformation("Validated temp token for user {UserId}", data.userId);
                    return data.userId;
                }
                else
                {
                    // Token expired
                    _tokens.TryRemove(token, out _);
                    _logger.LogWarning("Temp token expired for user {UserId}", data.userId);
                    return null;
                }
            }
            
            _logger.LogWarning("Invalid temp token attempted");
            return null;
        }

        private void CleanupExpiredTokens()
        {
            var expiredTokens = _tokens
                .Where(kvp => kvp.Value.expiry <= DateTime.UtcNow)
                .Select(kvp => kvp.Key)
                .ToList();
                
            foreach (var token in expiredTokens)
            {
                _tokens.TryRemove(token, out _);
            }
            
            if (expiredTokens.Count > 0)
            {
                _logger.LogDebug("Cleaned up {Count} expired temp tokens", expiredTokens.Count);
            }
        }
    }
}
