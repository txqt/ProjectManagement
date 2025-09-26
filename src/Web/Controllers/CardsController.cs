using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Authorization;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Board;
using ProjectManagement.Models.DTOs.Card;
using ProjectManagement.Services;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/columns/{columnId}/[controller]")]
    [Authorize]
    public class CardsController : ControllerBase
    {
        private readonly ICardService _cardService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IBoardNotificationService _boardNotificationService;

        public CardsController(ICardService cardService, UserManager<ApplicationUser> userManager, IBoardNotificationService boardNotificationService)
        {
            _cardService = cardService;
            _userManager = userManager;
            _boardNotificationService = boardNotificationService;
        }

        [HttpGet("{cardId}")]
        [HasPermission(Permissions.Cards.View)]
        public async Task<ActionResult<CardDto>> GetCard(string cardId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var card = await _cardService.GetCardAsync(cardId, userId);
            if (card == null)
                return NotFound();

            return Ok(card);
        }

        [HttpPost]
        [HasPermission(Permissions.Cards.Create)]
        public async Task<ActionResult<CardDto>> CreateCard(string columnId, [FromBody] CreateCardDto createCardDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var card = await _cardService.CreateCardAsync(columnId, createCardDto, userId);
            if (card == null)
                return NotFound();

            await _boardNotificationService.BroadcastCardCreated(card.BoardId, card.ColumnId, card, userId);
            return CreatedAtAction(nameof(GetCard), new { columnId, cardId = card.Id }, card);
        }

        [HttpPut("{cardId}")]
        [HasPermission(Permissions.Cards.Edit)]
        public async Task<ActionResult<CardDto>> UpdateCard(string cardId, [FromBody] UpdateCardDto updateCardDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var card = await _cardService.UpdateCardAsync(cardId, updateCardDto, userId);
            if (card == null)
                return NotFound();

            await _boardNotificationService.BroadcastCardUpdated(card.BoardId, card.ColumnId, card, userId);

            return Ok(card);
        }

        [HttpDelete("{cardId}")]
        [HasPermission(Permissions.Cards.Delete)]
        public async Task<ActionResult> DeleteCard(string cardId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _cardService.DeleteCardAsync(cardId, userId);
            if (result == null)
                return NotFound();

            await _boardNotificationService.BroadcastCardDeleted(result.BoardId, result.ColumnId, cardId, userId);

            return NoContent();
        }

        [HttpPost("{cardId}/move")]
        [HasPermission(Permissions.Cards.Move)]
        public async Task<ActionResult> MoveCard(string cardId, [FromBody] MoveCardDto moveCardDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _cardService.MoveCardAsync(cardId, moveCardDto, userId);
            if (result == null)
                return BadRequest();

            await _boardNotificationService.BroadcastCardMoved(result.BoardId, moveCardDto.FromColumnId, moveCardDto.ToColumnId, cardId, moveCardDto.NewIndex, userId);

            return NoContent();
        }

        [HttpPut("reorder")]
        [HasPermission(Permissions.Cards.Reorder)]
        public async Task<ActionResult> ReorderCards(string columnId, [FromBody] List<string> cardOrderIds)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _cardService.ReorderCardsAsync(columnId, cardOrderIds);
            if (result == null)
                return BadRequest();

            await _boardNotificationService.BroadcastCardsReordered(result.BoardId, result.ColumnId, result.CardOrderIds, userId);

            return NoContent();
        }

        [HttpPost("{cardId}/members")]
        [HasPermission(Permissions.Cards.Assign)]
        public async Task<ActionResult> AssignMember(string cardId, [FromBody] string memberEmail)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _cardService.AssignMemberAsync(cardId, memberEmail, userId);
            if (!success)
                return BadRequest("User not found or already assigned");

            return NoContent();
        }

        [HttpDelete("{cardId}/members/{memberId}")]
        [HasPermission(Permissions.Cards.Assign)]
        public async Task<ActionResult> UnassignMember(string cardId, string memberId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _cardService.UnassignMemberAsync(cardId, memberId, userId);
            if (!success)
                return NotFound();

            return NoContent();
        }
    }
}
