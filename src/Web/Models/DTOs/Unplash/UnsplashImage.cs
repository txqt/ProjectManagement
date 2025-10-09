namespace ProjectManagement.Models.DTOs.Unplash
{
    public class UnsplashImage
    {
        public string Id { get; set; } = "";
        public UnsplashUrls Urls { get; set; } = new();
    }
}