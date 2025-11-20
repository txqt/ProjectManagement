import BaseApiService from './baseApi';

class ColumnApi extends BaseApiService {
    async getColumn(boardId, columnId) {
        return this.request(`/boards/${boardId}/columns/${columnId}`);
    }

    async createColumn(boardId, columnData) {
        return this.request(`/boards/${boardId}/columns`, {
            method: 'POST',
            body: JSON.stringify(columnData),
        });
    }

    async updateColumn(boardId, columnId, updateData) {
        return this.request(`/boards/${boardId}/columns/${columnId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });
    }

    async deleteColumn(boardId, columnId) {
        return this.request(`/boards/${boardId}/columns/${columnId}`, {
            method: 'DELETE',
        });
    }

    async reorderColumns(boardId, columnOrderIds) {
        return this.request(`/boards/${boardId}/columns/reorder`, {
            method: 'PUT',
            body: JSON.stringify(columnOrderIds),
        });
    }

    async cloneColumn(boardId, columnId, cloneData) {
        return this.request(`/boards/${boardId}/columns/${columnId}/clone`, {
            method: 'POST',
            body: JSON.stringify(cloneData),
        });
    }
}

export default ColumnApi;
