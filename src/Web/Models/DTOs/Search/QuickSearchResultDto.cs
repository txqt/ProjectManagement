namespace ProjectManagement.Models.DTOs.Search
{
    public class QuickSearchResultDto
    {
        public string Query { get; set; } = string.Empty;
        public List<SearchBoardDto> Boards { get; set; } = new();
        public List<SearchCardDto> Cards { get; set; } = new();
        public List<SearchUserDto> Users { get; set; } = new();
        public int ReturnedCount { get; set; }
    }
}