using ProjectManagement.Models.DTOs.Column;

namespace ProjectManagement.Services.Interfaces
{
    public interface IColumnService
    {
        Task<ColumnDto?> GetColumnAsync(string columnId, string userId);
        Task<ColumnDto> CreateColumnAsync(string boardId, CreateColumnDto createColumnDto, string userId);
        Task<ColumnDto?> UpdateColumnAsync(string columnId, UpdateColumnDto updateColumnDto, string userId);
        Task<ColumnDto?> DeleteColumnAsync(string columnId, string userId);
        Task<bool> ReorderColumnsAsync(string boardId, List<string> columnOrderIds, string userId);
    }
}
