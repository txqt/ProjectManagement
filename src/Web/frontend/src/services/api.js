class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL;
    if (!this.baseURL) {
      throw new Error('VITE_API_BASE_URL environment variable is not set');
    }
    this.token = localStorage.getItem('authToken');
  }

  setAuthToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        let body = null;
        try {
          if (contentType && contentType.includes('application/json')) {
            body = await response.json();
          } else {
            body = await response.text();
          }
        } catch {
          body = null;
        }

        const error = new Error(body?.message || body || `HTTP error ${response.status}`);
        error.status = response.status;
        error.body = body;

        if (response.status === 401 && !options.skipAuthHandling) {
          this.setAuthToken(null);
        }


        throw error;
      }

      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return response;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }


  // Auth endpoints
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuthHandling: true,
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Board endpoints
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

  // Column endpoints
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


  async reorderCards(boardId, columnId, cards) {
    return this.request(`/boards/${boardId}/columns/${columnId}/cards/reorder`, {
      method: 'PUT',
      body: JSON.stringify(cards),
    });
  }


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

  async getMyPermissions() {
    return this.request('/permissions/my-permissions');
  }

  async checkBoardPermission(boardId, permission) {
    return this.request('/permissions/check-board-permission', {
      method: 'POST',
      body: JSON.stringify({ boardId, permission }),
    });
  }

  async getAvailablePermissions() {
    return this.request('/permissions/available-permissions');
  }

  // Admin endpoints
  async getAllUsers() {
    return this.request('/admin/users');
  }

  async getAllBoards() {
    return this.request('/boards/all');
  }

  async banUser(userId) {
    return this.request(`/admin/users/${userId}/ban`, {
      method: 'POST',
    });
  }

  async getSystemStats() {
    return this.request('/admin/stats');
  }

  async createBoardInvite(boardId, inviteData) {
    return this.request(`/boards/${boardId}/invites`, {
      method: 'POST',
      body: JSON.stringify(inviteData),
    });
  }

  async getBoardInvites(boardId, status = 'pending') {
    return this.request(`/boards/${boardId}/invites?status=${status}`);
  }

  async resendInvite(boardId, inviteId) {
    return this.request(`/boards/${boardId}/invites/${inviteId}/resend`, {
      method: 'POST',
    });
  }

  async cancelInvite(boardId, inviteId) {
    return this.request(`/boards/${boardId}/invites/${inviteId}`, {
      method: 'DELETE',
    });
  }

  async getMyInvites(status = null) {
    const params = status ? `?status=${status}` : '';
    return this.request(`/invites/my-invites${params}`);
  }

  async getInvite(inviteId) {
    return this.request(`/invites/${inviteId}`);
  }

  async respondToInvite(inviteId, response) {
    return this.request(`/invites/${inviteId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response }),
    });
  }

  // Notification methods
  async getNotifications(skip = 0, take = 20, unreadOnly = null) {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('take', take.toString());
    if (unreadOnly !== null) {
      params.append('unreadOnly', unreadOnly.toString());
    }

    return this.request(`/notifications?${params}`);
  }

  async getNotificationSummary() {
    return this.request('/notifications/summary');
  }

  async markNotificationAsRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/mark-all-read', {
      method: 'POST',
    });
  }

  async deleteNotification(notificationId) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  async bulkNotificationAction(notificationIds, action) {
    return this.request('/notifications/bulk-action', {
      method: 'POST',
      body: JSON.stringify({
        notificationIds,
        action
      }),
    });
  }

  async searchUsers(q, page = 1, pageSize = 10) {
    const params = new URLSearchParams({
      q: q.trim(),
      page: String(page),
      pageSize: String(pageSize)
    });

    return this.request(`/users/search?${params.toString()}`);
  }

  async searchUnsplash(query = 'wallpaper', perPage = 12) {
    const q = encodeURIComponent((query || 'wallpaper').trim());
    return this.request(`/unsplash/search?query=${q}&per_page=${perPage}`);
  }

  // Attachment methods
  async getAttachments(boardId, columnId, cardId) {
    return this.request(`/boards/${boardId}/columns/${columnId}/cards/${cardId}/attachments`);
  }

  async createAttachment(boardId, columnId, cardId, attachmentData) {
    return this.request(`/boards/${boardId}/columns/${columnId}/cards/${cardId}/attachments`, {
      method: 'POST',
      body: JSON.stringify(attachmentData),
    });
  }

  async deleteAttachment(boardId, columnId, cardId, attachmentId) {
    return this.request(`/boards/${boardId}/columns/${columnId}/cards/${cardId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
  }
  async uploadAttachment(boardId, columnId, cardId, file) {
    const url = `${this.baseURL}/boards/${boardId}/columns/${columnId}/cards/${cardId}/attachments`;
    const token = this.token;
    const form = new FormData();
    form.append('file', file);

    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, { method: 'POST', body: form, headers });
    if (!res.ok) {
      let body = null;
      try { body = await res.json(); } catch { body = await res.text(); }
      const error = new Error(body?.message || body || `HTTP error ${res.status}`);
      error.status = res.status;
      error.body = body;
      throw error;
    }

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) return await res.json();
    return res;
  }

  // Comment methods
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

  async generateShareToken(boardId) {
    return this.request(`/boards/${boardId}/share-token`, {
      method: 'POST',
    });
  }

  async joinViaShareLink(token, message = null) {
    return this.request('/boards/join', {
      method: 'POST',
      body: JSON.stringify({ token, message }),
    });
  }

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

  async getShareToken(boardId) {
    return this.request(`/boards/${boardId}/share-token`);
  }

  async quickSearch(q, limit = 5) {
    const query = encodeURIComponent((q || '').trim());
    return this.request(`/search/quick?q=${query}&limit=${limit}`);
  }

  async advancedSearch(request) {
    return this.request('/search/advanced', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getRecentSearches() {
    return this.request('/search/recent');
  }

  async getCardActivities(boardId, cardId, skip = 0, take = 50) {
    const params = new URLSearchParams({
      skip: String(skip),
      take: String(take)
    });
    return this.request(`/boards/${boardId}/activities/cards/${cardId}?${params.toString()}`);
  }

  async getBoardActivities(boardId, filter) {
    const params = new URLSearchParams();
    if (filter.userId) params.append('userId', filter.userId);
    if (filter.entityType) params.append('entityType', filter.entityType);
    if (filter.action) params.append('action', filter.action);
    params.append('skip', String(filter.skip || 0));
    params.append('take', String(filter.take || 50));
    return this.request(`/boards/${boardId}/activities?${params.toString()}`);
  }

  // Label methods
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

  // Checklist methods
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

export const apiService = new ApiService();