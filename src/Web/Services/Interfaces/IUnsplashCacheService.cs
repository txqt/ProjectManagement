using ProjectManagement.Models.DTOs.Unplash;

namespace ProjectManagement.Services.Interfaces
{
    public interface IUnsplashCacheService
    {
        Task<List<UnsplashImageDto>> GetCachedImagesAsync(string query);
        Task SetCachedImagesAsync(string query, List<UnsplashImageDto> images);
        Task ClearCacheAsync();
    }
}