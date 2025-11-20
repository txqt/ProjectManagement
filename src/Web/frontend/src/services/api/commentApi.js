import BaseApiService from './baseApi';

class CommentApi extends BaseApiService {
    async getComments(boardId, columnId, cardId) {
        return this.request(`/boards/${boardId}/columns/${columnId}/cards/${cardId}/comments`);
    }

    async createComment(boardId, columnId, cardId, commentData) {
        return this.request(`/boards/${boardId}/columns/${columnId}/cards/${cardId}/comments`, {
            method: 'POST',
            body: JSON.stringify(commentData),
        });
    }

    async updateComment(boardId, columnId, cardId, commentId, updateData) {
        return this.request(`/boards/${boardId}/columns/${columnId}/cards/${cardId}/comments/${commentId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });
    }

    async deleteComment(boardId, columnId, cardId, commentId) {
        return this.request(`/boards/${boardId}/columns/${columnId}/cards/${cardId}/comments/${commentId}`, {
            method: 'DELETE',
        });
    }
}

export default CommentApi;
