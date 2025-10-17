import { toast } from 'react-toastify';
import { API_ROOT } from '~/utils/constants';

class ApiService {
  constructor() {
    this.baseURL = API_ROOT;
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
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
        else if( response.status >= 400 && response.status < 500) {
          toast.error(body?.message || 'Yêu cầu không hợp lệ.');
        }
        else if (response.status >= 500) {
          toast.error('Lỗi máy chủ. Vui lòng thử lại sau.');
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
  async getBoards() {
    return this.request('/boards');
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
}

export const apiService = new ApiService();