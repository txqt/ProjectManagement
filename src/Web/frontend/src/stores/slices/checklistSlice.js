import { apiService } from '~/services/api';

export const createChecklistSlice = (set, get) => ({
    createChecklist: async (columnId, cardId, checklistData) => {
        const boardId = get().boardId;
        if (!boardId) throw new Error('No board selected');

        try {
            const newChecklist = await apiService.createChecklist(boardId, columnId, cardId, checklistData);
            return newChecklist;
        } catch (err) {
            console.error('createChecklist error:', err);
            throw err;
        }
    },

    updateChecklist: async (columnId, cardId, checklistId, updateData) => {
        const boardId = get().boardId;
        if (!boardId) throw new Error('No board selected');

        try {
            const updatedChecklist = await apiService.updateChecklist(boardId, columnId, cardId, checklistId, updateData);

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
                                            checklists: card.checklists.map(cl =>
                                                cl.id === checklistId ? updatedChecklist : cl
                                            )
                                        }
                                        : card
                                )
                            }
                            : col
                    )
                }
            }));

            return updatedChecklist;
        } catch (err) {
            console.error('updateChecklist error:', err);
            throw err;
        }
    },

    deleteChecklist: async (columnId, cardId, checklistId) => {
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
                                        checklists: card.checklists.filter(cl => cl.id !== checklistId)
                                    }
                                    : card
                            )
                        }
                        : col
                )
            }
        }));

        try {
            await apiService.deleteChecklist(boardId, columnId, cardId, checklistId);
        } catch (err) {
            set({ board: originalBoard });
            throw err;
        }
    },

    createChecklistItem: async (columnId, cardId, checklistId, itemData) => {
        const boardId = get().boardId;
        if (!boardId) throw new Error('No board selected');

        try {
            const newItem = await apiService.createChecklistItem(boardId, columnId, cardId, checklistId, itemData);
            return newItem;
        } catch (err) {
            console.error('createChecklistItem error:', err);
            throw err;
        }
    },

    updateChecklistItem: async (columnId, cardId, checklistId, itemId, updateData) => {
        const boardId = get().boardId;
        if (!boardId) throw new Error('No board selected');

        try {
            const updatedItem = await apiService.updateChecklistItem(boardId, columnId, cardId, checklistId, itemId, updateData);

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
                                            checklists: card.checklists.map(cl =>
                                                cl.id === checklistId
                                                    ? {
                                                        ...cl,
                                                        items: cl.items.map(item =>
                                                            item.id === itemId ? updatedItem : item
                                                        )
                                                    }
                                                    : cl
                                            )
                                        }
                                        : card
                                )
                            }
                            : col
                    )
                }
            }));

            return updatedItem;
        } catch (err) {
            console.error('updateChecklistItem error:', err);
            throw err;
        }
    },

    toggleChecklistItem: async (columnId, cardId, checklistId, itemId) => {
        const boardId = get().boardId;
        if (!boardId) throw new Error('No board selected');

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
                                        checklists: card.checklists.map(cl =>
                                            cl.id === checklistId
                                                ? {
                                                    ...cl,
                                                    items: cl.items.map(item =>
                                                        item.id === itemId
                                                            ? {
                                                                ...item,
                                                                isCompleted: !item.isCompleted,
                                                                completedAt: !item.isCompleted ? new Date().toISOString() : null
                                                            }
                                                            : item
                                                    )
                                                }
                                                : cl
                                        )
                                    }
                                    : card
                            )
                        }
                        : col
                )
            }
        }));

        try {
            await apiService.toggleChecklistItem(boardId, columnId, cardId, checklistId, itemId);
        } catch (err) {
            get().loadBoard(boardId);
            throw err;
        }
    },

    deleteChecklistItem: async (columnId, cardId, checklistId, itemId) => {
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
                                        checklists: card.checklists.map(cl =>
                                            cl.id === checklistId
                                                ? {
                                                    ...cl,
                                                    items: cl.items.filter(item => item.id !== itemId)
                                                }
                                                : cl
                                        )
                                    }
                                    : card
                            )
                        }
                        : col
                )
            }
        }));

        try {
            await apiService.deleteChecklistItem(boardId, columnId, cardId, checklistId, itemId);
        } catch (err) {
            set({ board: originalBoard });
            throw err;
        }
    },

    // SignalR handlers
    handleChecklistCreated: (data) => {
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
                                        checklists: [...(card.checklists || []), data.checklist]
                                            .sort((a, b) => a.position - b.position)
                                    }
                                    : card
                            )
                        }
                        : col
                )
            }
        }));
    },

    handleChecklistUpdated: (data) => {
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
                                        checklists: card.checklists.map(cl =>
                                            cl.id === data.checklist.id ? data.checklist : cl
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

    handleChecklistDeleted: (data) => {
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
                                        checklists: card.checklists.filter(cl => cl.id !== data.checklistId)
                                    }
                                    : card
                            )
                        }
                        : col
                )
            }
        }));
    },

    handleChecklistItemCreated: (data) => {
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
                                        checklists: card.checklists.map(cl =>
                                            cl.id === data.checklistId
                                                ? {
                                                    ...cl,
                                                    items: [...(cl.items || []), data.item]
                                                        .sort((a, b) => a.position - b.position)
                                                }
                                                : cl
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

    handleChecklistItemUpdated: (data) => {
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
                                        checklists: card.checklists.map(cl =>
                                            cl.id === data.checklistId
                                                ? {
                                                    ...cl,
                                                    items: cl.items.map(item =>
                                                        item.id === data.item.id ? data.item : item
                                                    )
                                                }
                                                : cl
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

    handleChecklistItemToggled: (data) => {
        const { columnId, cardId, checklistId, checklistItemDto } = data;
        console.log('handleChecklistItemToggled called with data:', data);

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
                                        checklists: card.checklists.map(cl =>
                                            cl.id === checklistId
                                                ? {
                                                    ...cl,
                                                    items: cl.items.map(item =>
                                                        item.id === checklistItemDto.id
                                                            ? {
                                                                ...item,
                                                                isCompleted: checklistItemDto.isCompleted,
                                                                completedAt: checklistItemDto.completedAt
                                                            }
                                                            : item
                                                    )
                                                }
                                                : cl
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

    handleChecklistItemDeleted: (data) => {
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
                                        checklists: card.checklists.map(cl =>
                                            cl.id === data.checklistId
                                                ? {
                                                    ...cl,
                                                    items: cl.items.filter(item => item.id !== data.itemId)
                                                }
                                                : cl
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
});
