import BaseApiService from './baseApi';

class BoardApi extends BaseApiService {
    // Board CRUD
    async getBoards(page = 1, pageSize = 12, search = null, sortBy = 'lastModified', sortOrder = 'desc') {
        const params = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString(),
            sortBy: sortBy,
            sortOrder: sortOrder
        });

        if (search && search.trim()) {
            params.append('search', search.trim());
        }

        return this.request(`/boards?${params.toString()}`);
    }

    async getBoard(boardId) {
        return this.request(`/boards/${boardId}`);
    }

    async createBoard(boardData) {
        return this.request(`/boards`, {
            method: 'POST',
            body: JSON.stringify(boardData),
        });
    }

    async updateBoard(boardId, updateData) {
        return this.request(`/boards/${boardId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });
    }

    async deleteBoard(boardId) {
        return this.request(`/boards/${boardId}`, {
            method: 'DELETE',
        });
    }

    // Board members
    async addBoardMember(boardId, memberData) {
        return this.request(`/boards/${boardId}/members`, {
            method: 'POST',
            body: JSON.stringify(memberData),
        });
    }

    async removeBoardMember(boardId, memberId) {
        return this.request(`/boards/${boardId}/members/${memberId}`, {
            method: 'DELETE',
        });
    }

    async updateBoardMemberRole(boardId, memberId, role) {
        return this.request(`/boards/${boardId}/members/${memberId}/role`, {
            method: 'PUT',
            body: JSON.stringify(role),
        });
    }

    // Board sharing
    async generateShareToken(boardId) {
        return this.request(`/boards/${boardId}/share-token`, {
            method: 'POST',
        });
    }

    async getShareToken(boardId) {
        return this.request(`/boards/${boardId}/share-token`);
    }

    async joinViaShareLink(token, message = null) {
        return this.request('/boards/join', {
            method: 'POST',
            body: JSON.stringify({ token, message }),
        });
    }

    // Join requests
    async createJoinRequest(boardId, message = null) {
        return this.request(`/boards/${boardId}/join-requests`, {
            method: 'POST',
            body: JSON.stringify({ message }),
        });
    }

    async getBoardJoinRequests(boardId, status = 'pending') {
        return this.request(`/boards/${boardId}/join-requests?status=${status}`);
    }

    async respondToJoinRequest(boardId, requestId, response, role = 'member') {
        return this.request(`/boards/${boardId}/join-requests/${requestId}/respond`, {
            method: 'POST',
            body: JSON.stringify({ response, role }),
        });
    }

    async cancelJoinRequest(boardId, requestId) {
        return this.request(`/boards/${boardId}/join-requests/${requestId}`, {
            method: 'DELETE',
        });
    }

    async getMyJoinRequests(status = null) {
        const params = status ? `?status=${status}` : '';
        return this.request(`/join-requests/my-requests${params}`);
    }

    // Templates
    async makeTemplate(boardId) {
        return this.request(`/boards/${boardId}/make-template`, {
            method: 'POST',
        });
    }

    async convertToBoard(boardId) {
        return this.request(`/boards/${boardId}/convert-to-board`, {
            method: 'POST',
        });
    }

    async getTemplates() {
        return this.request('/boards/templates');
    }

    async createFromTemplate(templateId, createData) {
        return this.request(`/boards/templates/${templateId}/create`, {
            method: 'POST',
            body: JSON.stringify(createData),
        });
    }

    async cloneBoard(boardId, cloneData) {
        return this.request(`/boards/${boardId}/clone`, {
            method: 'POST',
            body: JSON.stringify(cloneData),
        });
    }

    async getAllBoards() {
        return this.request('/boards/all');
    }
}

export default BoardApi;
