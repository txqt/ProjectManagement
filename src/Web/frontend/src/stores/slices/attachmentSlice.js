import { apiService } from '~/services/api';

export const createAttachmentSlice = (set, get) => ({
    createAttachment: async (columnId, cardId, attachmentData) => {
        const boardId = get().boardId;
        if (!boardId) throw new Error('No board selected');

        try {
            const newAttachment = await apiService.createAttachment(boardId, columnId, cardId, attachmentData);

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
                                            attachments: (card.attachments || []).some(a => a.id === newAttachment.id)
                                                ? card.attachments.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                                                : [...(card.attachments || []), newAttachment].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                                        }
                                        : card
                                )
                            }
                            : col
                    )
                }
            }));

            return newAttachment;
        } catch (err) {
            console.error('createAttachment error:', err);
            throw err;
        }
    },

    uploadAttachment: async (columnId, cardId, file) => {
        const boardId = get().boardId;
        if (!boardId) throw new Error('No board selected');

        try {
            const uploaded = await apiService.uploadAttachment(boardId, columnId, cardId, file);
            const newAttachment = uploaded;

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
                                            attachments: (card.attachments || []).some(a => a.id === newAttachment.id)
                                                ? card.attachments.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                                                : [...(card.attachments || []), newAttachment].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                                        }
                                        : card
                                )
                            }
                            : col
                    )
                }
            }));

            return newAttachment;
        } catch (err) {
            console.error('uploadAttachment error:', err);
            throw err;
        }
    },

    deleteAttachment: async (columnId, cardId, attachmentId) => {
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
                                        attachments: card.attachments.filter(a => a.id !== attachmentId)
                                    }
                                    : card
                            )
                        }
                        : col
                )
            }
        }));

        try {
            await apiService.deleteAttachment(boardId, columnId, cardId, attachmentId);
        } catch (err) {
            set({ board: originalBoard });
            throw err;
        }
    },

    // SignalR handlers
    handleAttachmentAdded: (data) => {
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
                                        attachments: (card.attachments || []).some(a => a.id === data.attachment.id)
                                            ? card.attachments.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                                            : [...(card.attachments || []), data.attachment].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                                    }
                                    : card
                            )
                        }
                        : col
                )
            }
        }));
    },

    handleAttachmentDeleted: (data) => {
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
                                        attachments: card.attachments.filter(a => a.id !== data.attachmentId)
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
