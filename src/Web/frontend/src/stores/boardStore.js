import { create } from 'zustand';
import { apiService } from '~/services/api';
import { sortCardsByRank, sortColumnsByRank } from '~/utils/sorts';

export const useBoardStore = create((set, get) => ({
    board: null,
    loading: false,
    error: null,
    currentUser: null,
    pendingTempIds: new Set(),
    boardId: null,

    // Set board ID
    setBoardId: (boardId) => set({ boardId }),

    // Set current user
    setCurrentUser: (user) => set({ currentUser: user }),

    // Load board
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
            set({ error: err.message, loading: false });
        }
    },

    // Create column
    createColumn: async (createColumnDto) => {
        const boardId = get().boardId;
        if (!boardId) throw new Error('No board selected');

        const tempId = `temp-col-${Date.now()}`;
        const tempColumn = {
            id: tempId,
            title: createColumnDto.title,
            boardId,
            rank: '',
            cards: []
        };

        set(state => ({
            board: {
                ...state.board,
                columns: [...(state.board?.columns || []), tempColumn]
            },
            pendingTempIds: new Set([...state.pendingTempIds, tempId])
        }));

        try {
            const newColumn = await apiService.createColumn(boardId, createColumnDto);
            set(state => ({
                board: {
                    ...state.board,
                    columns: state.board.columns.map(col =>
                        col.id === tempId ? newColumn : col
                    ).sort((a, b) => (a.rank || '').localeCompare(b.rank || ''))
                },
                pendingTempIds: new Set([...state.pendingTempIds].filter(id => id !== tempId))
            }));
        } catch (err) {
            set(state => ({
                board: {
                    ...state.board,
                    columns: state.board.columns.filter(col => col.id !== tempId)
                },
                pendingTempIds: new Set([...state.pendingTempIds].filter(id => id !== tempId))
            }));
            throw err;
        }
    },

    // Update column
    updateColumn: async (columnId, updateColumnDto) => {
        set(state => ({
            board: {
                ...state.board,
                columns: state.board.columns.map(col =>
                    col.id === columnId ? { ...col, ...updateColumnDto } : col
                )
            }
        }));

        try {
            const updated = await apiService.updateColumn(columnId, updateColumnDto);
            set(state => ({
                board: {
                    ...state.board,
                    columns: state.board.columns.map(col =>
                        col.id === columnId ? updated : col
                    )
                }
            }));
        } catch (err) {
            get().loadBoard(get().boardId);
            throw err;
        }
    },

    // Delete column
    deleteColumn: async (columnId) => {
        const originalBoard = get().board;
        set(state => ({
            board: {
                ...state.board,
                columns: state.board.columns.filter(col => col.id !== columnId)
            }
        }));

        try {
            await apiService.deleteColumn(get().boardId, columnId);
        } catch (err) {
            set({ board: originalBoard });
            throw err;
        }
    },

    // Create card
    createCard: async (columnId, createCardDto) => {
        const tempId = `temp-card-${Date.now()}`;
        const tempCard = {
            id: tempId,
            columnId,
            title: createCardDto.title,
            description: createCardDto.description || '',
            rank: '',
            members: [],
            comments: [],
            attachments: []
        };

        set(state => ({
            board: {
                ...state.board,
                columns: state.board.columns.map(col =>
                    col.id === columnId
                        ? {
                            ...col,
                            cards: [...col.cards, tempCard]
                        }
                        : col
                )
            },
            pendingTempIds: new Set([...state.pendingTempIds, tempId])
        }));

        try {
            const newCard = await apiService.createCard(get().boardId, columnId, createCardDto);
            set(state => ({
                board: {
                    ...state.board,
                    columns: state.board.columns.map(col =>
                        col.id === columnId
                            ? {
                                ...col,
                                cards: col.cards
                                    .map(card => (card.id === tempId ? newCard : card))
                                    .sort((a, b) => (a.rank || '').localeCompare(b.rank || ''))
                            }
                            : col
                    )
                },
                pendingTempIds: new Set([...state.pendingTempIds].filter(id => id !== tempId))
            }));
        } catch (err) {
            set(state => ({
                board: {
                    ...state.board,
                    columns: state.board.columns.map(col =>
                        col.id === columnId
                            ? { ...col, cards: col.cards.filter(card => card.id !== tempId) }
                            : col
                    )
                },
                pendingTempIds: new Set([...state.pendingTempIds].filter(id => id !== tempId))
            }));
            throw err;
        }
    },

    // Update card
    updateCard: async (columnId, cardId, updateCardDto) => {
        set(state => ({
            board: {
                ...state.board,
                columns: state.board.columns.map(col =>
                    col.id === columnId
                        ? {
                            ...col,
                            cards: col.cards.map(card =>
                                card.id === cardId ? { ...card, ...updateCardDto } : card
                            )
                        }
                        : col
                )
            }
        }));

        try {
            const updated = await apiService.updateCard(get().boardId, columnId, cardId, updateCardDto);
            set(state => ({
                board: {
                    ...state.board,
                    columns: state.board.columns.map(col =>
                        col.id === columnId
                            ? {
                                ...col,
                                cards: col.cards.map(card => (card.id === cardId ? updated : card))
                            }
                            : col
                    )
                }
            }));
            return true;
        } catch (err) {
            get().loadBoard(get().boardId);
            throw err;
        }
    },

    // Delete card
    deleteCard: async (columnId, cardId) => {
        const originalBoard = get().board;
        set(state => ({
            board: {
                ...state.board,
                columns: state.board.columns.map(col =>
                    col.id === columnId
                        ? { ...col, cards: col.cards.filter(card => card.id !== cardId) }
                        : col
                )
            }
        }));

        try {
            await apiService.deleteCard(get().boardId, columnId, cardId);
        } catch (err) {
            set({ board: originalBoard });
            throw err;
        }
    },

    // Move card between columns or reorder within same column
    moveCard: async (fromColumnId, toColumnId, cardId, newIndex) => {
        const originalBoard = get().board;

        // Optimistic update
        set(state => {
            const card = state.board.columns
                .find(c => c.id === fromColumnId)
                ?.cards.find(c => c.id === cardId);

            if (!card) return state;

            const sourceCol = state.board.columns.find(c => c.id === fromColumnId);
            const destCol = state.board.columns.find(c => c.id === toColumnId);

            if (!sourceCol || !destCol) return state;

            const updatedSourceCards = sourceCol.cards.filter(c => c.id !== cardId);
            const updatedDestCards = [...destCol.cards];
            updatedDestCards.splice(newIndex, 0, { ...card, columnId: toColumnId });

            return {
                board: {
                    ...state.board,
                    columns: state.board.columns.map(col => {
                        if (col.id === fromColumnId) return { ...col, cards: updatedSourceCards };
                        if (col.id === toColumnId) return { ...col, cards: updatedDestCards };
                        return col;
                    })
                }
            };
        });

        try {
            await apiService.moveCard(
                get().boardId,
                toColumnId,
                cardId,
                { fromColumnId, toColumnId, newIndex }
            );
        } catch (err) {
            set({ board: originalBoard });
            throw err;
        }
    },

    // Thay thế hàm reorderCards bằng đoạn sau
    reorderCards: async (columnId, cardIds) => {
        const originalBoard = get().board;

        // Optimistic update: reorder card objects and assign temp ranks so any rank-based sorting
        // on render will preserve the optimistic order.
        set(state => {
            const columns = state.board.columns.map(col => {
                if (col.id !== columnId) return col;

                const idToCard = col.cards.reduce((m, c) => {
                    m[c.id] = c;
                    return m;
                }, {});

                const newCards = cardIds
                    .map((id, idx) => {
                        const card = idToCard[id];
                        if (!card) return null;
                        // Gán rank tạm: zero-padded index (hoặc LexoRank nếu bạn muốn)
                        return { ...card, rank: String(idx).padStart(6, '0') };
                    })
                    .filter(Boolean);

                const rest = col.cards.filter(c => !cardIds.includes(c.id));
                return { ...col, cards: [...newCards, ...rest] };
            });

            return { board: { ...state.board, columns } };
        });

        try {
            await apiService.reorderCards(get().boardId, columnId, cardIds);
        } catch (err) {
            // rollback
            set({ board: originalBoard });
            throw err;
        }
    },



    // Reorder columns
    reorderColumns: async (columnIds) => {
        const originalBoard = get().board;

        // Optimistic update: gán rank tạm thời cho các column
        set(state => {
            const idToColumn = state.board.columns.reduce((map, col) => {
                map[col.id] = col;
                return map;
            }, {});

            const newColumns = columnIds
                .map((id, idx) => {
                    const column = idToColumn[id];
                    if (!column) return null;

                    // Gán rank tạm — để render ổn định, zero-padded
                    return { ...column, rank: String(idx).padStart(6, '0') };
                })
                .filter(Boolean);

            // Giữ lại các column không nằm trong danh sách reorder (nếu có)
            const rest = state.board.columns.filter(c => !columnIds.includes(c.id));

            return {
                board: {
                    ...state.board,
                    columns: [...newColumns, ...rest]
                }
            };
        });

        try {
            await apiService.reorderColumns(get().boardId, columnIds);
        } catch (err) {
            // Rollback nếu lỗi
            set({ board: originalBoard });
            throw err;
        }
    },


    // Assign member to card
    assignCardMember: async (columnId, cardId, memberEmail) => {
        const success = await apiService.assignCardMember(cardId, memberEmail);
        if (success) {
            // Reload card to get updated members
            const card = await apiService.getCard(cardId);
            set(state => ({
                board: {
                    ...state.board,
                    columns: state.board.columns.map(col =>
                        col.id === columnId
                            ? {
                                ...col,
                                cards: col.cards.map(c => (c.id === cardId ? card : c))
                            }
                            : col
                    )
                }
            }));
        }
        return success;
    },

    // Unassign member from card
    unassignCardMember: async (columnId, cardId, memberId) => {
        const success = await apiService.unassignCardMember(cardId, memberId);
        if (success) {
            // Reload card to get updated members
            const card = await apiService.getCard(cardId);
            set(state => ({
                board: {
                    ...state.board,
                    columns: state.board.columns.map(col =>
                        col.id === columnId
                            ? {
                                ...col,
                                cards: col.cards.map(c => (c.id === cardId ? card : c))
                            }
                            : col
                    )
                }
            }));
        }
        return success;
    },

    // SignalR handlers
    handleColumnCreated: (data) => {
        set(state => ({
            board: {
                ...state.board,
                columns: [...state.board.columns, data.column]
                    .sort((a, b) => (a.rank || '').localeCompare(b.rank || ''))
            }
        }));
    },

    handleColumnUpdated: (data) => {
        set(state => ({
            board: {
                ...state.board,
                columns: state.board.columns.map(col =>
                    col.id === data.column.id ? data.column : col
                )
            }
        }));
    },

    handleColumnDeleted: (data) => {
        set(state => ({
            board: {
                ...state.board,
                columns: state.board.columns.filter(col => col.id !== data.columnId)
            }
        }));
    },

    handleColumnsReordered: (data) => {
        console.log('🟢 ColumnsReordered received:', data);
        if (Array.isArray(data.orderedColumns)) {
            set(state => ({
                board: {
                    ...state.board,
                    columns: data.orderedColumns
                }
            }));
            console.log('Columns updated from server event.');
        }
    },

    handleCardCreated: (data) => {
        set(state => ({
            board: {
                ...state.board,
                columns: state.board.columns.map(col =>
                    col.id === data.columnId
                        ? {
                            ...col,
                            cards: [...col.cards, data.card]
                                .sort((a, b) => (a.rank || '').localeCompare(b.rank || ''))
                        }
                        : col
                )
            }
        }));
    },

    handleCardUpdated: (data) => {
        set(state => ({
            board: {
                ...state.board,
                columns: state.board.columns.map(col =>
                    col.id === data.columnId
                        ? {
                            ...col,
                            cards: col.cards.map(c => (c.id === data.card.id ? data.card : c))
                        }
                        : col
                )
            }
        }));
    },

    handleCardDeleted: (data) => {
        set(state => ({
            board: {
                ...state.board,
                columns: state.board.columns.map(col =>
                    col.id === data.columnId
                        ? { ...col, cards: col.cards.filter(c => c.id !== data.cardId) }
                        : col
                )
            }
        }));
    },

    handleCardsReordered: (data) => {
        console.log('🔵 CardsReordered received:', data);
        if (data.columnId && Array.isArray(data.orderedCards)) {
            set(state => ({
                board: {
                    ...state.board,
                    columns: state.board.columns.map(col =>
                        col.id === data.columnId ? { ...col, cards: data.orderedCards } : col
                    )
                }
            }));
            console.log('Cards updated from server event.');
        }

        // if (data.columnId && Array.isArray(data.cardIds)) {
        //     set(state => {
        //         const idToColumn = {};
        //         state.board.columns.forEach(c => { idToColumn[c.id] = c; });

        //         return {
        //             board: {
        //                 ...state.board,
        //                 columns: state.board.columns.map(col => {
        //                     if (col.id !== data.columnId) return col;
        //                     const idToCard = col.cards.reduce((m, c) => { m[c.id] = c; return m; }, {});
        //                     const newCards = data.cardIds.map(id => idToCard[id]).filter(Boolean);
        //                     const rest = col.cards.filter(c => !data.cardIds.includes(c.id));
        //                     return { ...col, cards: [...newCards, ...rest] };
        //                 })
        //             }
        //         };
        //     });
        // }
    },

    handleCardMoved: (data) => {
        set(state => {
            const card = state.board.columns
                .find(c => c.id === data.fromColumnId)
                ?.cards.find(c => c.id === data.cardId);

            if (!card) return state;

            const sourceCol = state.board.columns.find(c => c.id === data.fromColumnId);
            const destCol = state.board.columns.find(c => c.id === data.toColumnId);

            if (!sourceCol || !destCol) return state;

            return {
                board: {
                    ...state.board,
                    columns: state.board.columns.map(col => {
                        if (col.id === data.fromColumnId) {
                            return { ...col, cards: col.cards.filter(c => c.id !== data.cardId) };
                        }
                        if (col.id === data.toColumnId) {
                            const updatedCards = [...col.cards];
                            updatedCards.splice(data.newIndex, 0, { ...card, columnId: data.toColumnId });
                            return { ...col, cards: updatedCards };
                        }
                        return col;
                    })
                }
            };
        });
    },

    handleCardAssigned: (data) => {
        set(state => ({
            board: {
                ...state.board,
                columns: state.board.columns.map(col =>
                    col.id === data.columnId
                        ? {
                            ...col,
                            cards: col.cards.map(c =>
                                c.id === data.card.id ? data.card : c
                            )
                        }
                        : col
                )
            }
        }));
    },

    handleCardUnassigned: (data) => {
        set(state => ({
            board: {
                ...state.board,
                columns: state.board.columns.map(col =>
                    col.id === data.columnId
                        ? {
                            ...col,
                            cards: col.cards.map(c =>
                                c.id === data.card.id ? data.card : c
                            )
                        }
                        : col
                )
            }
        }));
    }
}));