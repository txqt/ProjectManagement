using ProjectManagement.Models.DTOs.Label;

namespace ProjectManagement.Services.Interfaces
{
    public interface ILabelService
    {
        Task<List<LabelDto>> GetBoardLabelsAsync(string boardId);
        Task<LabelDto> CreateLabelAsync(string boardId, CreateLabelDto createDto, string userId);
        Task<LabelDto?> UpdateLabelAsync(string labelId, UpdateLabelDto updateDto, string userId);
        Task<bool> DeleteLabelAsync(string labelId, string userId);
        Task<bool> AddLabelToCardAsync(string boardId, string columnId, string cardId, string labelId, string userId);
        Task<bool> RemoveLabelFromCardAsync(string boardId, string columnId, string cardId, string labelId, string userId);
    }
}