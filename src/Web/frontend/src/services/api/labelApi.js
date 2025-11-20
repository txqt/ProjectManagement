import BaseApiService from './baseApi';

class LabelApi extends BaseApiService {
    async getBoardLabels(boardId) {
        return this.request(`/boards/${boardId}/labels`);
    }

    async createLabel(boardId, labelData) {
        return this.request(`/boards/${boardId}/labels`, {
            method: 'POST',
            body: JSON.stringify(labelData),
        });
    }

    async updateLabel(boardId, labelId, updateData) {
        return this.request(`/boards/${boardId}/labels/${labelId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });
    }

    async deleteLabel(boardId, labelId) {
        return this.request(`/boards/${boardId}/labels/${labelId}`, {
            method: 'DELETE',
        });
    }

    async addLabelToCard(boardId, cardId, labelId, columnId) {
        return this.request(`/boards/${boardId}/labels/cards/${cardId}/labels/${labelId}?columnId=${columnId}`, {
            method: 'POST',
        });
    }

    async removeLabelFromCard(boardId, cardId, labelId, columnId) {
        return this.request(`/boards/${boardId}/labels/cards/${cardId}/labels/${labelId}?columnId=${columnId}`, {
            method: 'DELETE',
        });
    }
}

export default LabelApi;
