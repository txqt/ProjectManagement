import BaseApiService from './baseApi';

class UserApiService extends BaseApiService {
    constructor() {
        super();
    }

    // Get current user profile
    async getProfile() {
        return this.request('/users/profile', {
            method: 'GET'
        });
    }

    // Update user profile
    async updateProfile(data) {
        return this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // Change password
    async changePassword(data) {
        return this.request('/users/password', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
}

export default new UserApiService();
