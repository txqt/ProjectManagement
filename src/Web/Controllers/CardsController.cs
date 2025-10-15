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
    [Route("api/boards/{boardId}/columns/{columnId}/[controller]")]
    [Authorize]
    public class CardsController : ControllerBase
    {
        private readonly ICardService _cardService;
        private readonly UserManager<ApplicationUser> _userManager;

        public CardsController(ICardService cardService, UserManager<ApplicationUser> userManager)
        {
            _cardService = cardService;
            _userManager = userManager;
        }

        [HttpGet("{cardId}")]
        [RequireBoardPermission(Permissions.Cards.View)]
        public async Task<ActionResult<CardDto>> GetCard(string cardId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var card = await _cardService.GetCardAsync(cardId);
            if (card == null)
                return NotFound();

            return Ok(card);
        }

        [HttpPost]
        [RequireBoardPermission(Permissions.Cards.Create)]
        public async Task<ActionResult<CardDto>> CreateCard(string columnId, [FromBody] CreateCardDto createCardDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var card = await _cardService.CreateCardAsync(columnId, createCardDto, userId);
            if (card == null)
                return NotFound();

            return CreatedAtAction(nameof(GetCard), new { boardId = card.BoardId, columnId, cardId = card.Id }, card);

        }

        [HttpPut("{cardId}")]
        [RequireBoardPermission(Permissions.Cards.Edit)]
        public async Task<ActionResult<CardDto>> UpdateCard(string cardId, [FromBody] UpdateCardDto updateCardDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var card = await _cardService.UpdateCardAsync(cardId, updateCardDto, userId);
            if (card == null)
                return NotFound();

            return Ok(card);
        }

        [HttpDelete("{cardId}")]
        [RequireBoardPermission(Permissions.Cards.Delete)]
        public async Task<ActionResult> DeleteCard(string cardId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _cardService.DeleteCardAsync(cardId, userId);
            if (result == null)
                return NotFound();

            return NoContent();
        }

        [HttpPost("{cardId}/move")]
        [RequireBoardPermission(Permissions.Cards.Move)]
        public async Task<ActionResult> MoveCard(string cardId, [FromBody] MoveCardDto moveCardDto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _cardService.MoveCardAsync(cardId, moveCardDto, userId);
            if (result == null)
                return BadRequest();

            return NoContent();
        }

        [HttpPut("reorder")]
        [RequireBoardPermission(Permissions.Cards.Move)]
        public async Task<ActionResult> ReorderCards(string boardId, string columnId, [FromBody] List<string> cardIds)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _cardService.ReorderCardsAsync(boardId, columnId, cardIds, userId);
            if (!success)
                return BadRequest();

            return NoContent();
        }

        [HttpPost("{cardId}/members")]
        [RequireBoardPermission(Permissions.Cards.Assign)]
        public async Task<ActionResult> AssignMember(string cardId, [FromBody] string memberEmail)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _cardService.AssignMemberAsync(cardId, memberEmail, userId);
            if (!success)
                return BadRequest("User not found or already assigned");

            return Ok(await _cardService.GetCardAsync(cardId));
        }

        [HttpDelete("{cardId}/members/{memberId}")]
        [RequireBoardPermission(Permissions.Cards.Assign)]
        public async Task<ActionResult> UnassignMember(string cardId, string memberId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _cardService.UnassignMemberAsync(cardId, memberId, userId);
            if (!success)
                return NotFound();

            return Ok(await _cardService.GetCardAsync(cardId));
        }
    }
}
