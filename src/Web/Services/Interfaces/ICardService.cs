using ProjectManagement.Models.DTOs.Board;
using ProjectManagement.Models.DTOs.Card;

namespace ProjectManagement.Services.Interfaces
{
    public interface ICardService
    {
        Task<CardDto?> GetCardAsync(string cardId, string userId);
        Task<CardDto> CreateCardAsync(string columnId, CreateCardDto createCardDto, string userId);
        Task<CardDto?> UpdateCardAsync(string cardId, UpdateCardDto updateCardDto, string userId);
        Task<bool> DeleteCardAsync(string cardId, string userId);
        Task<bool> MoveCardAsync(string cardId, MoveCardDto moveCardDto, string userId);
        Task<bool> ReorderCardsAsync(string columnId, List<string> cardOrderIds);
        Task<bool> AssignMemberAsync(string cardId, string memberEmail, string userId);
        Task<bool> UnassignMemberAsync(string cardId, string memberId, string userId);
    }
}
