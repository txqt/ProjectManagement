import { apiService } from '~/services/api';

export const createLabelSlice = (set, get) => ({
    boardLabels: [],

    loadBoardLabels: async (boardId) => {
        try {
            const labels = await apiService.getBoardLabels(boardId);
            set({ boardLabels: labels });
        } catch (err) {
            console.error('loadBoardLabels error:', err);
            throw err;
        }
    },

    createLabel: async (labelData) => {
        const boardId = get().boardId;
        if (!boardId) throw new Error('No board selected');

        try {
            const newLabel = await apiService.createLabel(boardId, labelData);
            return newLabel;
        } catch (err) {
            console.error('createLabel error:', err);
            throw err;
        }
    },

    updateLabel: async (labelId, updateData) => {
        const boardId = get().boardId;
        if (!boardId) throw new Error('No board selected');

        try {
            const updatedLabel = await apiService.updateLabel(boardId, labelId, updateData);
            set(state => ({
                boardLabels: state.boardLabels.map(l => l.id === labelId ? updatedLabel : l)
            }));
            return updatedLabel;
        } catch (err) {
            console.error('updateLabel error:', err);
            throw err;
        }
    },

    deleteLabel: async (labelId) => {
        const boardId = get().boardId;
        if (!boardId) throw new Error('No board selected');

        const originalLabels = get().boardLabels;

        set(state => ({
            boardLabels: state.boardLabels.filter(l => l.id !== labelId)
        }));

        try {
            await apiService.deleteLabel(boardId, labelId);
        } catch (err) {
            set({ boardLabels: originalLabels });
            throw err;
        }
    },

    addLabelToCard: async (columnId, cardId, labelId) => {
        const boardId = get().boardId;
        if (!boardId) throw new Error('No board selected');

        const label = get().boardLabels.find(l => l.id === labelId);
        if (!label) throw new Error('Label not found');

        set(state => ({
            board: {
                ...state.board,
                columns: state.board.columns.map(col =>
                    col.id === columnId
                        ? {
                            ...col,
                            cards: col.cards.map(card =>
                                card.id === cardId
                                    ? {
                                        ...card,
                                        labels: card.labels.some(l => l.id === labelId)
                                            ? card.labels
                                            : [...card.labels, label]
                                    }
                                    : card
                            )
                        }
                        : col
                )
            }
        }));

        try {
            await apiService.addLabelToCard(boardId, cardId, labelId, columnId);
        } catch (err) {
            get().loadBoard(boardId);
            throw err;
        }
    },

    removeLabelFromCard: async (columnId, cardId, labelId) => {
        const boardId = get().boardId;
        if (!boardId) throw new Error('No board selected');

        const originalBoard = get().board;

        set(state => ({
            board: {
                ...state.board,
                columns: state.board.columns.map(col =>
                    col.id === columnId
                        ? {
                            ...col,
                            cards: col.cards.map(card =>
                                card.id === cardId
                                    ? {
                                        ...card,
                                        labels: card.labels.filter(l => l.id !== labelId)
                                    }
                                    : card
                            )
                        }
                        : col
                )
            }
        }));

        try {
            await apiService.removeLabelFromCard(boardId, cardId, labelId, columnId);
        } catch (err) {
            set({ board: originalBoard });
            throw err;
        }
    },

    // SignalR handlers
    handleLabelCreated: (data) => {
        set(state => ({
            boardLabels: [...state.boardLabels, data.label]
        }));
    },

    handleLabelUpdated: (data) => {
        set(state => ({
            boardLabels: state.boardLabels.map(l => l.id === data.label.id ? data.label : l)
        }));
    },

    handleLabelDeleted: (data) => {
        set(state => ({
            boardLabels: state.boardLabels.filter(l => l.id !== data.labelId),
            board: {
                ...state.board,
                columns: state.board.columns.map(col => ({
                    ...col,
                    cards: col.cards.map(card => ({
                        ...card,
                        labels: card.labels.filter(l => l.id !== data.labelId)
                    }))
                }))
            }
        }));
    },

    handleCardLabelAdded: (data) => {
        const label = get().boardLabels.find(l => l.id === data.labelId);
        if (!label) return;

        set(state => ({
            board: {
                ...state.board,
                columns: state.board.columns.map(col =>
                    col.id === data.columnId
                        ? {
                            ...col,
                            cards: col.cards.map(card =>
                                card.id === data.cardId
                                    ? {
                                        ...card,
                                        labels: card.labels.some(l => l.id === data.labelId)
                                            ? card.labels
                                            : [...card.labels, label]
                                    }
                                    : card
                            )
                        }
                        : col
                )
            }
        }));
    },

    handleCardLabelRemoved: (data) => {
        set(state => ({
            board: {
                ...state.board,
                columns: state.board.columns.map(col =>
                    col.id === data.columnId
                        ? {
                            ...col,
                            cards: col.cards.map(card =>
                                card.id === data.cardId
                                    ? {
                                        ...card,
                                        labels: card.labels.filter(l => l.id !== data.labelId)
                                    }
                                    : card
                            )
                        }
                        : col
                )
            }
        }));
    },
});
