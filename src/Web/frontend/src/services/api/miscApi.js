import BaseApiService from './baseApi';

class MiscApi extends BaseApiService {
    // Auth
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

    // Permissions
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

    // Admin
    async getAllUsers() {
        return this.request('/admin/users');
    }

    async banUser(userId) {
        return this.request(`/admin/users/${userId}/ban`, {
            method: 'POST',
        });
    }

    async getSystemStats() {
        return this.request('/admin/stats');
    }

    // Invites
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

    // Notifications
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

    // Search
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

    // Activities
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
}

export default MiscApi;
