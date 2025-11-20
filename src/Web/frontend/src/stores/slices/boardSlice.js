import { apiService } from '~/services/api';

export const createBoardSlice = (set, get) => ({
    // State
    board: null,
    loading: false,
    error: null,
    boardId: null,

    // Actions
    setBoardId: (boardId) => set({ boardId }),

    loadBoard: async (boardId) => {
        set({ loading: true, error: null });
        try {
            const board = await apiService.getBoard(boardId);
            // Sort columns and cards by rank
            if (board.columns) {
                board.columns = board.columns
                    .sort((a, b) => (a.rank || '').localeCompare(b.rank || ''))
                    .map(col => ({
                        ...col,
                        cards: (col.cards || []).sort((a, b) => (a.rank || '').localeCompare(b.rank || ''))
                    }));
            }
            set({ board, loading: false });
        } catch (err) {
            set({ error: err.message || err, loading: false });
        }
    },

    updateBoard: async (updateBoardDto) => {
        set({ loading: true, error: null });
        try {
            const updatedBoard = await apiService.updateBoard(get().boardId, updateBoardDto);
            set({ board: { ...get().board, ...updatedBoard }, loading: false });
        } catch (err) {
            set({ error: err.message || err, loading: false });
            throw err;
        }
    },

    deleteBoard: async () => {
        set({ loading: true, error: null });
        await apiService.deleteBoard(get().boardId);
        set({ board: null, boardId: null, loading: false });
    },

    addBoardMember: async (memberEmail) => {
        const boardId = get().boardId;
        if (!boardId) throw new Error('No board selected');
        set({ loading: true, error: null });
        try {
            const newMember = await apiService.addBoardMember(boardId, { email: memberEmail });
            set(state => ({
                board: {
                    ...state.board,
                    members: [...(state.board.members || []), newMember]
                },
                loading: false
            }));
        } catch (err) {
            set({ error: err.message || err, loading: false });
            throw err;
        }
    },

    removeBoardMember: async (memberId) => {
        const boardId = get().boardId;
        if (!boardId) throw new Error('No board selected');
        set({ loading: true, error: null });
        try {
            await apiService.removeBoardMember(boardId, memberId);
            set(state => ({
                board: {
                    ...state.board,
                    members: state.board.members.filter(m => m.id !== memberId)
                },
                loading: false
            }));
        } catch (err) {
            set({ error: err.message || err, loading: false });
            throw err;
        }
    },

    updateBoardMemberRole: async (memberId, newRole) => {
        const boardId = get().boardId;
        if (!boardId) throw new Error('No board selected');
        set({ loading: true, error: null });

        await apiService.updateBoardMemberRole(boardId, memberId, { role: newRole });
        set(state => ({
            board: {
                ...state.board,
                members: state.board.members.map(m =>
                    m.id === memberId ? { ...m, role: newRole } : m
                ),
            },
            loading: false,
        }));
    },

    makeTemplate: async () => {
        set({ loading: true, error: null });
        try {
            await apiService.makeTemplate(get().boardId);
            set({ board: { ...get().board, type: "template" }, loading: false });
        } catch (err) {
            set({ error: err.message || err, loading: false });
            throw err;
        }
    },

    convertToBoard: async () => {
        set({ loading: true, error: null });
        try {
            await apiService.convertToBoard(get().boardId);
            set({ board: { ...get().board, type: "private" }, loading: false });
        } catch (err) {
            set({ error: err.message || err, loading: false });
            throw err;
        }
    },

    cloneBoard: async (boardId, cloneData) => {
        try {
            const clonedBoard = await apiService.cloneBoard(boardId, cloneData);
            return clonedBoard;
        } catch (err) {
            console.error('cloneBoard error:', err);
            throw err;
        }
    },
});
