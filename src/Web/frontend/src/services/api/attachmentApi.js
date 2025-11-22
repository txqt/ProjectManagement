import BaseApiService from './baseApi';

class AttachmentApi extends BaseApiService {
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
        const url = `${this.baseURL}/boards/${boardId}/columns/${columnId}/cards/${cardId}/attachments/upload`;
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
}

export default AttachmentApi;
