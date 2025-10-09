using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Models.DTOs.Unplash;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UnsplashController : ControllerBase
    {
        private readonly IUnsplashCacheService _cacheService;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;

        public UnsplashController(
            IUnsplashCacheService cacheService,
            HttpClient httpClient,
            IConfiguration config)
        {
            _cacheService = cacheService;
            _httpClient = httpClient;
            _config = config;
        }

        [HttpGet("search")]
        public async Task<ActionResult<List<UnsplashImageDto>>> SearchImages(
            [FromQuery] string query,
            [FromQuery] int page = 1)
        {
            if (string.IsNullOrWhiteSpace(query))
                return BadRequest("Query is required");

            var cached = await _cacheService.GetCachedImagesAsync($"{query}-{page}");
            if (cached != null) return Ok(cached);

            var key = _config["Unsplash:AccessKey"];
            var url = $"https://api.unsplash.com/search/photos" +
                      $"?query={Uri.EscapeDataString(query)}" +
                      $"&per_page=12&page={page}&client_id={key}";

            try
            {
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadFromJsonAsync<UnsplashSearchResponse>();

                var images = json.Results.Select(i => new UnsplashImageDto
                {
                    Id = i.Id,
                    Thumb = i.Urls.Small,
                    Full = i.Urls.Regular
                }).ToList();

                await _cacheService.SetCachedImagesAsync($"{query}-{page}", images);

                return Ok(images);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}