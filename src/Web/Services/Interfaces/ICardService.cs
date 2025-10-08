using ProjectManagement.Models.DTOs.Board;
using ProjectManagement.Models.DTOs.Card;

namespace ProjectManagement.Services.Interfaces
{
    public interface ICardService
    {
        Task<CardDto?> GetCardAsync(string cardId, string userId);
        Task<CardDto?> CreateCardAsync(string columnId, CreateCardDto createCardDto, string userId);
        Task<CardDto?> UpdateCardAsync(string cardId, UpdateCardDto updateCardDto, string userId);
        Task<CardDto?> DeleteCardAsync(string cardId, string userId);
        Task<CardDto?> MoveCardAsync(string cardId, MoveCardDto moveCardDto, string userId);
        Task<CardsReorderedResponse> ReorderCardsAsync(string columnId, List<string> cardOrderIds, string userId);
        Task<bool> AssignMemberAsync(string cardId, string memberEmail, string userId);
        Task<bool> UnassignMemberAsync(string cardId, string memberId, string userId);
    }
}
