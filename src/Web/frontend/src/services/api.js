// Import all API modules
import BoardApi from './api/boardApi';
import ColumnApi from './api/columnApi';
import CardApi from './api/cardApi';
import CommentApi from './api/commentApi';
import AttachmentApi from './api/attachmentApi';
import LabelApi from './api/labelApi';
import ChecklistApi from './api/checklistApi';
import MiscApi from './api/miscApi';
import UserApi from './api/userApi';

// Create a combined API service that includes all modules
class ApiService {
    constructor() {
        // Initialize all API modules
        this.boardApi = new BoardApi();
        this.columnApi = new ColumnApi();
        this.cardApi = new CardApi();
        this.commentApi = new CommentApi();
        this.attachmentApi = new AttachmentApi();
        this.labelApi = new LabelApi();
        this.checklistApi = new ChecklistApi();
        this.miscApi = new MiscApi();
        this.userApi = new UserApi();

        // Share the same token across all modules
        this._token = localStorage.getItem('authToken');
    }

    setAuthToken(token) {
        this._token = token;
        // Update token in all modules
        this.boardApi.setAuthToken(token);
        this.columnApi.setAuthToken(token);
        this.cardApi.setAuthToken(token);
        this.commentApi.setAuthToken(token);
        this.attachmentApi.setAuthToken(token);
        this.labelApi.setAuthToken(token);
        this.checklistApi.setAuthToken(token);
        this.miscApi.setAuthToken(token);
        this.userApi.setAuthToken(token);
    }

    // ========== AUTH ==========
    login(...args) { return this.miscApi.login(...args); }
    register(...args) { return this.miscApi.register(...args); }

    // ========== BOARDS ==========
    getBoards(...args) { return this.boardApi.getBoards(...args); }
    getBoard(...args) { return this.boardApi.getBoard(...args); }
    createBoard(...args) { return this.boardApi.createBoard(...args); }
    updateBoard(...args) { return this.boardApi.updateBoard(...args); }
    deleteBoard(...args) { return this.boardApi.deleteBoard(...args); }
    addBoardMember(...args) { return this.boardApi.addBoardMember(...args); }
    removeBoardMember(...args) { return this.boardApi.removeBoardMember(...args); }
    updateBoardMemberRole(...args) { return this.boardApi.updateBoardMemberRole(...args); }
    generateShareToken(...args) { return this.boardApi.generateShareToken(...args); }
    getShareToken(...args) { return this.boardApi.getShareToken(...args); }
    joinViaShareLink(...args) { return this.boardApi.joinViaShareLink(...args); }
    createJoinRequest(...args) { return this.boardApi.createJoinRequest(...args); }
    getBoardJoinRequests(...args) { return this.boardApi.getBoardJoinRequests(...args); }
    respondToJoinRequest(...args) { return this.boardApi.respondToJoinRequest(...args); }
    cancelJoinRequest(...args) { return this.boardApi.cancelJoinRequest(...args); }
    getMyJoinRequests(...args) { return this.boardApi.getMyJoinRequests(...args); }
    makeTemplate(...args) { return this.boardApi.makeTemplate(...args); }
    convertToBoard(...args) { return this.boardApi.convertToBoard(...args); }
    getTemplates(...args) { return this.boardApi.getTemplates(...args); }
    createFromTemplate(...args) { return this.boardApi.createFromTemplate(...args); }
    cloneBoard(...args) { return this.boardApi.cloneBoard(...args); }
    getAllBoards(...args) { return this.boardApi.getAllBoards(...args); }

    // ========== COLUMNS ==========
    getColumn(...args) { return this.columnApi.getColumn(...args); }
    createColumn(...args) { return this.columnApi.createColumn(...args); }
    updateColumn(...args) { return this.columnApi.updateColumn(...args); }
    deleteColumn(...args) { return this.columnApi.deleteColumn(...args); }
    reorderColumns(...args) { return this.columnApi.reorderColumns(...args); }
    cloneColumn(...args) { return this.columnApi.cloneColumn(...args); }

    // ========== CARDS ==========
    getCard(...args) { return this.cardApi.getCard(...args); }
    createCard(...args) { return this.cardApi.createCard(...args); }
    updateCard(...args) { return this.cardApi.updateCard(...args); }
    deleteCard(...args) { return this.cardApi.deleteCard(...args); }
    moveCard(...args) { return this.cardApi.moveCard(...args); }
    reorderCards(...args) { return this.cardApi.reorderCards(...args); }
    assignCardMember(...args) { return this.cardApi.assignCardMember(...args); }
    unassignCardMember(...args) { return this.cardApi.unassignCardMember(...args); }
    cloneCard(...args) { return this.cardApi.cloneCard(...args); }

    // ========== COMMENTS ==========
    getComments(...args) { return this.commentApi.getComments(...args); }
    createComment(...args) { return this.commentApi.createComment(...args); }
    updateComment(...args) { return this.commentApi.updateComment(...args); }
    deleteComment(...args) { return this.commentApi.deleteComment(...args); }

    // ========== ATTACHMENTS ==========
    getAttachments(...args) { return this.attachmentApi.getAttachments(...args); }
    createAttachment(...args) { return this.attachmentApi.createAttachment(...args); }
    deleteAttachment(...args) { return this.attachmentApi.deleteAttachment(...args); }
    uploadAttachment(...args) { return this.attachmentApi.uploadAttachment(...args); }

    // ========== LABELS ==========
    getBoardLabels(...args) { return this.labelApi.getBoardLabels(...args); }
    createLabel(...args) { return this.labelApi.createLabel(...args); }
    updateLabel(...args) { return this.labelApi.updateLabel(...args); }
    deleteLabel(...args) { return this.labelApi.deleteLabel(...args); }
    addLabelToCard(...args) { return this.labelApi.addLabelToCard(...args); }
    removeLabelFromCard(...args) { return this.labelApi.removeLabelFromCard(...args); }

    // ========== CHECKLISTS ==========
    createChecklist(...args) { return this.checklistApi.createChecklist(...args); }
    updateChecklist(...args) { return this.checklistApi.updateChecklist(...args); }
    deleteChecklist(...args) { return this.checklistApi.deleteChecklist(...args); }
    createChecklistItem(...args) { return this.checklistApi.createChecklistItem(...args); }
    updateChecklistItem(...args) { return this.checklistApi.updateChecklistItem(...args); }
    toggleChecklistItem(...args) { return this.checklistApi.toggleChecklistItem(...args); }
    deleteChecklistItem(...args) { return this.checklistApi.deleteChecklistItem(...args); }

    // ========== PERMISSIONS ==========
    getMyPermissions(...args) { return this.miscApi.getMyPermissions(...args); }
    checkBoardPermission(...args) { return this.miscApi.checkBoardPermission(...args); }
    getAvailablePermissions(...args) { return this.miscApi.getAvailablePermissions(...args); }

    // ========== ADMIN ==========
    getAllUsers(...args) { return this.miscApi.getAllUsers(...args); }
    banUser(...args) { return this.miscApi.banUser(...args); }
    getSystemStats(...args) { return this.miscApi.getSystemStats(...args); }

    // ========== INVITES ==========
    createBoardInvite(...args) { return this.miscApi.createBoardInvite(...args); }
    getBoardInvites(...args) { return this.miscApi.getBoardInvites(...args); }
    resendInvite(...args) { return this.miscApi.resendInvite(...args); }
    cancelInvite(...args) { return this.miscApi.cancelInvite(...args); }
    getMyInvites(...args) { return this.miscApi.getMyInvites(...args); }
    getInvite(...args) { return this.miscApi.getInvite(...args); }
    respondToInvite(...args) { return this.miscApi.respondToInvite(...args); }

    // ========== NOTIFICATIONS ==========
    getNotifications(...args) { return this.miscApi.getNotifications(...args); }
    getNotificationSummary(...args) { return this.miscApi.getNotificationSummary(...args); }
    markNotificationAsRead(...args) { return this.miscApi.markNotificationAsRead(...args); }
    markAllNotificationsAsRead(...args) { return this.miscApi.markAllNotificationsAsRead(...args); }
    deleteNotification(...args) { return this.miscApi.deleteNotification(...args); }
    bulkNotificationAction(...args) { return this.miscApi.bulkNotificationAction(...args); }

    // ========== SEARCH ==========
    searchUsers(...args) { return this.miscApi.searchUsers(...args); }
    searchUnsplash(...args) { return this.miscApi.searchUnsplash(...args); }
    quickSearch(...args) { return this.miscApi.quickSearch(...args); }
    advancedSearch(...args) { return this.miscApi.advancedSearch(...args); }
    getRecentSearches(...args) { return this.miscApi.getRecentSearches(...args); }

    // ========== USER PROFILE ==========
    getProfile(...args) { return this.userApi.getProfile(...args); }
    updateProfile(...args) { return this.userApi.updateProfile(...args); }
    changePassword(...args) { return this.userApi.changePassword(...args); }

    // ========== TWO-FACTOR AUTHENTICATION ==========
    get2FAStatus(...args) { return this.userApi.get2FAStatus(...args); }
    enable2FA(...args) { return this.userApi.enable2FA(...args); }
    verify2FA(...args) { return this.userApi.verify2FA(...args); }
    disable2FA(...args) { return this.userApi.disable2FA(...args); }
    verify2FALogin(...args) { return this.userApi.verify2FALogin(...args); }

    // ========== ACTIVITIES ==========
    getCardActivities(...args) { return this.miscApi.getCardActivities(...args); }
    getBoardActivities(...args) { return this.miscApi.getBoardActivities(...args); }
}

export const apiService = new ApiService();