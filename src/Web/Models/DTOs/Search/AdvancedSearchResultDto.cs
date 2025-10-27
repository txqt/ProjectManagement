namespace ProjectManagement.Models.DTOs.Search
{
    public class AdvancedSearchResultDto
    {
        public string? Query { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        
        public List<SearchBoardDto> Boards { get; set; } = new();
        public List<SearchCardDto> Cards { get; set; } = new();
        public List<SearchUserDto> Users { get; set; } = new();
        
        public int TotalBoards { get; set; }
        public int TotalCards { get; set; }
        public int TotalUsers { get; set; }
        public int TotalResults { get; set; }
    }
}