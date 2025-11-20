import BaseApiService from './baseApi';

class CardApi extends BaseApiService {
    async getCard(boardId, columnId, cardId) {
        return this.request(`/boards/${boardId}/columns/${columnId}/cards/${cardId}`);
    }

    async createCard(boardId, columnId, cardData) {
        return this.request(`/boards/${boardId}/columns/${columnId}/cards`, {
            method: 'POST',
            body: JSON.stringify(cardData),
        });
    }

    async updateCard(boardId, columnId, cardId, updateData) {
        return this.request(`/boards/${boardId}/columns/${columnId}/cards/${cardId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });
    }

    async deleteCard(boardId, columnId, cardId) {
        return this.request(`/boards/${boardId}/columns/${columnId}/cards/${cardId}`, {
            method: 'DELETE',
        });
    }

    async moveCard(boardId, columnId, cardId, moveData) {
        return this.request(`/boards/${boardId}/columns/${columnId}/cards/${cardId}/move`, {
            method: 'POST',
            body: JSON.stringify(moveData),
        });
    }

    async reorderCards(boardId, columnId, cards) {
        return this.request(`/boards/${boardId}/columns/${columnId}/cards/reorder`, {
            method: 'PUT',
            body: JSON.stringify(cards),
        });
    }

    async assignCardMember(boardId, columnId, cardId, memberEmail) {
        return this.request(`/boards/${boardId}/columns/${columnId}/cards/${cardId}/members`, {
            method: 'POST',
            body: JSON.stringify(memberEmail),
        });
    }

    async unassignCardMember(boardId, columnId, cardId, memberId) {
        return this.request(`/boards/${boardId}/columns/${columnId}/cards/${cardId}/members/${memberId}`, {
            method: 'DELETE',
        });
    }

    async cloneCard(boardId, columnId, cardId, cloneData) {
        return this.request(`/boards/${boardId}/columns/${columnId}/cards/${cardId}/clone`, {
            method: 'POST',
            body: JSON.stringify(cloneData),
        });
    }
}

export default CardApi;
