import { apiService } from '~/services/api';

export const createCommentSlice = (set, get) => ({
    createComment: async (columnId, cardId, commentData) => {
        const boardId = get().boardId;
        if (!boardId) throw new Error('No board selected');

        try {
            const newComment = await apiService.createComment(boardId, columnId, cardId, commentData);

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
                                            comments: (card.comments || []).some(c => c.id === newComment.id)
                                                ? card.comments.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                                                : [...(card.comments || []), newComment].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                                        }
                                        : card
                                )
                            }
                            : col
                    )
                }
            }));

            return newComment;
        } catch (err) {
            console.error('createComment error:', err);
            throw err;
        }
    },

    updateComment: async (columnId, cardId, commentId, updateData) => {
        const boardId = get().boardId;
        if (!boardId) throw new Error('No board selected');

        try {
            const updatedComment = await apiService.updateComment(boardId, columnId, cardId, commentId, updateData);

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
                                            comments: card.comments.map(c =>
                                                c.id === commentId ? updatedComment : c
                                            )
                                        }
                                        : card
                                )
                            }
                            : col
                    )
                }
            }));

            return updatedComment;
        } catch (err) {
            console.error('updateComment error:', err);
            throw err;
        }
    },

    deleteComment: async (columnId, cardId, commentId) => {
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
                                        comments: card.comments.filter(c => c.id !== commentId)
                                    }
                                    : card
                            )
                        }
                        : col
                )
            }
        }));

        try {
            await apiService.deleteComment(boardId, columnId, cardId, commentId);
        } catch (err) {
            set({ board: originalBoard });
            throw err;
        }
    },

    // SignalR handlers
    handleCommentAdded: (data) => {
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
                                        comments: (card.comments || []).some(c => c.id === data.comment.id)
                                            ? card.comments.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                                            : [...(card.comments || []), data.comment].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                                    }
                                    : card
                            )
                        }
                        : col
                )
            }
        }));
    },

    handleCommentUpdated: (data) => {
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
                                        comments: card.comments.map(c =>
                                            c.id === data.comment.id ? data.comment : c
                                        )
                                    }
                                    : card
                            )
                        }
                        : col
                )
            }
        }));
    },

    handleCommentDeleted: (data) => {
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
                                        comments: card.comments.filter(c => c.id !== data.commentId)
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
