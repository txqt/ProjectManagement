using ProjectManagement.Models.DTOs.Checklist;

namespace ProjectManagement.Services.Interfaces
{
    public interface IChecklistService
    {
        Task<ChecklistDto> CreateChecklistAsync(string boardId, string columnId, string cardId, CreateChecklistDto createDto, string userId);
        Task<ChecklistDto?> UpdateChecklistAsync(string checklistId, UpdateChecklistDto updateDto, string userId);
        Task<bool> DeleteChecklistAsync(string checklistId, string userId);
        
        Task<ChecklistItemDto> CreateChecklistItemAsync(string checklistId, CreateChecklistItemDto createDto, string userId);
        Task<ChecklistItemDto?> UpdateChecklistItemAsync(string itemId, UpdateChecklistItemDto updateDto, string userId);
        Task<bool> DeleteChecklistItemAsync(string itemId, string userId);
        Task<bool> ToggleChecklistItemAsync(string itemId, string userId);
    }
}