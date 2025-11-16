using ProjectManagement.Models.DTOs.Board;
using ProjectManagement.Models.DTOs.Card;

namespace ProjectManagement.Services.Interfaces
{
    public interface ICardService
    {
        Task<CardDto?> GetCardAsync(string cardId);
        Task<CardDto?> CreateCardAsync(string columnId, CreateCardDto createCardDto, string userId);
        Task<CardDto?> UpdateCardAsync(string cardId, UpdateCardDto updateCardDto, string userId);
        Task<CardDto?> DeleteCardAsync(string cardId, string userId);
        Task<CardDto?> MoveCardAsync(string cardId, MoveCardDto moveCardDto, string userId);
        Task<bool> ReorderCardsAsync(string boardId, string columnId, List<string> cardIds, string userId);
        Task<bool> AssignMemberAsync(string cardId, string memberEmail, string userId);
        Task<bool> UnassignMemberAsync(string cardId, string memberId, string userId);
        Task<CardDto> CloneCardAsync(string columnId, string cardId, CloneCardDto cloneDto, string userId);
    }
}
