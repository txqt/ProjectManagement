import { API_ROOT } from '~/utils/contants';

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

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          this.setAuthToken(null);
          window.location.href = '/login';
          return;
        }

        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
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

  
  async reorderCards(columnId, cardOrderIds) {
    return this.request(`/columns/${columnId}/cards/reorder`, {
      method: 'PUT',
      body: JSON.stringify(cardOrderIds),
    });
  }

  // Card endpoints
  async getCard(columnId, cardId) {
    return this.request(`/columns/${columnId}/cards/${cardId}`);
  }

  async createCard(columnId, cardData) {
    return this.request(`/columns/${columnId}/cards`, {
      method: 'POST',
      body: JSON.stringify(cardData),
    });
  }

  async updateCard(columnId, cardId, updateData) {
    return this.request(`/columns/${columnId}/cards/${cardId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteCard(columnId, cardId) {
    return this.request(`/columns/${columnId}/cards/${cardId}`, {
      method: 'DELETE',
    });
  }

  async moveCard(columnId, cardId, moveData) {
    return this.request(`/columns/${columnId}/cards/${cardId}/move`, {
      method: 'POST',
      body: JSON.stringify(moveData),
    });
  }

  async assignCardMember(columnId, cardId, memberEmail) {
    return this.request(`/columns/${columnId}/cards/${cardId}/members`, {
      method: 'POST',
      body: JSON.stringify(memberEmail),
    });
  }

  async unassignCardMember(columnId, cardId, memberId) {
    return this.request(`/columns/${columnId}/cards/${cardId}/members/${memberId}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();