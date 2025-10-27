using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Search
{
    public class AdvancedSearchRequestDto
    {
        public string? Query { get; set; }
        public bool SearchBoards { get; set; } = true;
        public bool SearchCards { get; set; } = true;
        public bool SearchUsers { get; set; } = false;
        
        // Filters
        public string? BoardId { get; set; }
        public string? ColumnId { get; set; }
        public List<string>? BoardTypes { get; set; }
        public bool AssignedToMe { get; set; } = false;
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
        
        // Pagination
        [Range(1, int.MaxValue, ErrorMessage = "Page must be at least 1")]
        public int Page { get; set; } = 1;
        [Range(1, 100, ErrorMessage = "PageSize must be between 1 and 100")]
        public int PageSize { get; set; } = 20;
    }
}