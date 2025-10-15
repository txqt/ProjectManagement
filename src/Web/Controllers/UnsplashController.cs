using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Attributes;
using ProjectManagement.Models.DTOs.Unplash;
using ProjectManagement.Services.Interfaces;
using System.Text.RegularExpressions;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [RateLimit(RequestsPerMinute = 10, RequestsPerHour = 100)]
    public class UnsplashController : ControllerBase
    {
        private readonly IUnsplashCacheService _cacheService;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;
        private static readonly Regex AllowedQueryPattern = 
            new Regex(@"^[a-zA-Z0-9\s\-]+$", RegexOptions.Compiled);

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

            if (query.Length < 2)
                return BadRequest("Query must be at least 2 characters");

            if (query.Length > 50)
                return BadRequest("Query is too long (max 50 characters)");

            if (!AllowedQueryPattern.IsMatch(query))
                return BadRequest("Query contains invalid characters");

            if (page < 1 || page > 20)
                return BadRequest("Invalid page number (1-20)");

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