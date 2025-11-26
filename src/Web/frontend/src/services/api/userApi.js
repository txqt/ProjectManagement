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

    // Get 2FA status
    async get2FAStatus() {
        return this.request('/twofactor/status', {
            method: 'GET'
        });
    }

    // Enable 2FA
    async enable2FA() {
        return this.request('/twofactor/enable', {
            method: 'POST'
        });
    }

    // Verify 2FA code
    async verify2FA(code) {
        return this.request('/twofactor/verify', {
            method: 'POST',
            body: JSON.stringify({ code })
        });
    }

    // Disable 2FA
    async disable2FA() {
        return this.request('/twofactor/disable', {
            method: 'POST'
        });
    }

    async verify2FALogin(data) {
    return this.request('/auth/verify-2fa', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}
}

export default UserApiService;
