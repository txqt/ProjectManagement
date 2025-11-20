import BaseApiService from './baseApi';

class ChecklistApi extends BaseApiService {
    // Checklist operations
    async createChecklist(boardId, columnId, cardId, checklistData) {
        return this.request(`/boards/${boardId}/columns/${columnId}/cards/${cardId}/checklists`, {
            method: 'POST',
            body: JSON.stringify(checklistData),
        });
    }

    async updateChecklist(boardId, columnId, cardId, checklistId, updateData) {
        return this.request(`/boards/${boardId}/columns/${columnId}/cards/${cardId}/checklists/${checklistId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });
    }

    async deleteChecklist(boardId, columnId, cardId, checklistId) {
        return this.request(`/boards/${boardId}/columns/${columnId}/cards/${cardId}/checklists/${checklistId}`, {
            method: 'DELETE',
        });
    }

    // Checklist item operations
    async createChecklistItem(boardId, columnId, cardId, checklistId, itemData) {
        return this.request(`/boards/${boardId}/columns/${columnId}/cards/${cardId}/checklists/${checklistId}/items`, {
            method: 'POST',
            body: JSON.stringify(itemData),
        });
    }

    async updateChecklistItem(boardId, columnId, cardId, checklistId, itemId, updateData) {
        return this.request(`/boards/${boardId}/columns/${columnId}/cards/${cardId}/checklists/${checklistId}/items/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });
    }

    async toggleChecklistItem(boardId, columnId, cardId, checklistId, itemId) {
        return this.request(`/boards/${boardId}/columns/${columnId}/cards/${cardId}/checklists/${checklistId}/items/${itemId}/toggle`, {
            method: 'POST',
        });
    }

    async deleteChecklistItem(boardId, columnId, cardId, checklistId, itemId) {
        return this.request(`/boards/${boardId}/columns/${columnId}/cards/${cardId}/checklists/${checklistId}/items/${itemId}`, {
            method: 'DELETE',
        });
    }
}

export default ChecklistApi;
