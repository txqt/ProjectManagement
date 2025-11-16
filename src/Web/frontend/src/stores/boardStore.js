import { create } from 'zustand';
import { apiService } from '~/services/api';

export const useBoardStore = create((set, get) => ({
    board: null,
    loading: false,
    error: null,
    currentUser: null,
    pendingTempIds: new Set(),
    boardId: null,
    joinRequests: [],
    boardLabels: [],

    // Set board ID
    setBoardId: (boardId) => set({ boardId }),

    // Set current user
    setCurrentUser: (user) => set({ currentUser: user }),

    setJoinRequests: (joinRequests) => set({ joinRequests }),

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
            set({ error: err.message || err, loading: false });
        }
    },

    // Update board
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
    // Delete board
    deleteBoard: async () => {
        set({ loading: true, error: null });
        await apiService.deleteBoard(get().boardId);
        set({ board: null, boardId: null, loading: false });
    },

    // Add board member
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

    // Remove board member
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

    // Update member role
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
        const success = await apiService.assignCardMember(get().boardId, columnId, cardId, memberEmail);
        if (success) {
            // Reload card to get updated members
            const card = await apiService.getCard(get().boardId, columnId, cardId);
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
        const success = await apiService.unassignCardMember(get().boardId, columnId, cardId, memberId);
        if (success) {
            // Reload card to get updated members
            const card = await apiService.getCard(get().boardId, columnId, cardId);
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
        if (data.columnId && Array.isArray(data.orderedCards)) {
            set(state => {
                const targetColumn = state.board.columns.find(c => c.id === data.columnId);
                if (!targetColumn) return state;

                // Tạo map từ ID -> card hiện tại (giữ full data)
                const existingCardsMap = new Map();
                targetColumn.cards.forEach(card => {
                    existingCardsMap.set(card.id, card);
                });

                // Merge: giữ data cũ, chỉ update rank từ server
                const mergedCards = data.orderedCards.map(serverCard => {
                    const existingCard = existingCardsMap.get(serverCard.id);

                    if (existingCard) {
                        // Giữ toàn bộ nested data từ local, chỉ update rank
                        return {
                            ...existingCard,
                            rank: serverCard.rank,
                            // Update các field khác nếu server gửi
                            title: serverCard.title ?? existingCard.title,
                            description: serverCard.description ?? existingCard.description,
                            cover: serverCard.cover ?? existingCard.cover,
                        };
                    }

                    // Nếu là card mới từ server
                    return serverCard;
                });

                return {
                    board: {
                        ...state.board,
                        columns: state.board.columns.map(col =>
                            col.id === data.columnId
                                ? { ...col, cards: mergedCards }
                                : col
                        )
                    }
                };
            });
        }
    },

    handleCardMoved: (data) => {
        set(state => {
            const sourceCol = state.board.columns.find(c => c.id === data.fromColumnId);
            const destCol = state.board.columns.find(c => c.id === data.toColumnId);

            if (!sourceCol || !destCol) return state;

            // Tìm card với FULL DATA từ source column
            const movedCard = sourceCol.cards.find(c => c.id === data.cardId);
            if (!movedCard) return state;

            return {
                board: {
                    ...state.board,
                    columns: state.board.columns.map(col => {
                        // Remove từ source
                        if (col.id === data.fromColumnId) {
                            return {
                                ...col,
                                cards: col.cards.filter(c => c.id !== data.cardId)
                            };
                        }

                        // Add vào destination với FULL DATA
                        if (col.id === data.toColumnId) {
                            const updatedCards = [...col.cards];
                            const cardToInsert = {
                                ...movedCard,
                                columnId: data.toColumnId,
                                rank: data.newRank ?? movedCard.rank
                            };

                            updatedCards.splice(data.newIndex, 0, cardToInsert);
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
    },

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

        // Optimistic update
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

    // ========== ATTACHMENT ACTIONS ==========
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

    // Upload binary/file and add as attachment (centralized)
    uploadAttachment: async (columnId, cardId, file) => {
        const boardId = get().boardId;
        if (!boardId) throw new Error('No board selected');

        try {
            const uploaded = await apiService.uploadAttachment(boardId, columnId, cardId, file);

            // uploaded should be an attachment object
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

        // Optimistic update
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

    // ========== SIGNALR HANDLERS FOR COMMENTS ==========
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

    // ========== SIGNALR HANDLERS FOR ATTACHMENTS ==========
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

    handleJoinRequestCreated: (data) => {
        console.log('handleJoinRequestCreated called with data:', data);
        try {
            const boardId = data?.boardId || data?.board?.id;
            const request = data?.request || data;

            // nếu không cùng board thì bỏ qua
            if (!boardId || boardId !== get().boardId) return;

            set(state => ({
                joinRequests: [request, ...(state.joinRequests || [])]
            }));
        } catch (err) {
            console.error('handleJoinRequestCreated error', err);
        }
    },

    handleJoinRequestResponded: (data) => {
        // data có thể là { boardId, requestId, status, userId }
        try {
            const boardId = data?.boardId || data?.board?.id;
            const requestId = data?.requestId || data?.id;
            const status = (data?.status || '').toLowerCase();

            // nếu có boardId và không phải board hiện tại -> skip
            if (boardId && boardId !== get().boardId) return;

            // cập nhật request trong joinRequests nếu có
            set(state => {
                const updated = (state.joinRequests || []).map(r => {
                    if (r.id === requestId) {
                        return {
                            ...r,
                            status,
                            respondedAt: r.respondedAt || new Date().toISOString()
                        };
                    }
                    return r;
                });
                return { joinRequests: updated };
            });

            // Nếu request được approved -> reload board để lấy member mới
            if (status === 'approved') {
                const currentBoardId = get().boardId;
                if (currentBoardId) {
                    // reload toàn bộ board: sẽ cập nhật members và columns/các dữ liệu khác
                    get().loadBoard(currentBoardId).catch(err => {
                        console.error('Failed to reload board after join request approved', err);
                    });
                }
            }
        } catch (err) {
            console.error('handleJoinRequestResponded error', err);
        }
    },

    handleActivityLogged: (data) => {
        try {
            const boardId = data?.boardId || data?.board?.id;

            // nếu không cùng board thì bỏ qua
            if (!boardId || boardId !== get().boardId) return;

        } catch (err) {
            console.error('handleActivityLogged error', err);
        }
    },
    // ========== LABEL ACTIONS ==========
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

        // Optimistic update
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

        // Optimistic update
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

        // Optimistic update
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

    // ========== CHECKLIST ACTIONS ==========
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

        // Optimistic update
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

        // Optimistic update
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

        // Optimistic update
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

    // ========== SIGNALR HANDLERS FOR LABELS ==========
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

    // ========== SIGNALR HANDLERS FOR CHECKLISTS ==========
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
    // Clone board
    cloneBoard: async (boardId, cloneData) => {
        try {
            const clonedBoard = await apiService.cloneBoard(boardId, cloneData);
            return clonedBoard;
        } catch (err) {
            console.error('cloneBoard error:', err);
            throw err;
        }
    },

    // Save as template
    saveAsTemplate: async (boardId) => {
        try {
            const template = await apiService.saveAsTemplate(boardId);
            return template;
        } catch (err) {
            console.error('saveAsTemplate error:', err);
            throw err;
        }
    },

    // Clone column
    cloneColumn: async (columnId, cloneData) => {
        const boardId = get().boardId;
        if (!boardId) throw new Error('No board selected');

        try {
            const clonedColumn = await apiService.cloneColumn(boardId, columnId, cloneData);

            set(state => ({
                board: {
                    ...state.board,
                    columns: [...state.board.columns, clonedColumn]
                        .sort((a, b) => (a.rank || '').localeCompare(b.rank || ''))
                }
            }));

            return clonedColumn;
        } catch (err) {
            console.error('cloneColumn error:', err);
            throw err;
        }
    },

    // Clone card
    cloneCard: async (columnId, cardId, cloneData) => {
        const boardId = get().boardId;
        if (!boardId) throw new Error('No board selected');

        try {
            const clonedCard = await apiService.cloneCard(boardId, columnId, cardId, cloneData);

            set(state => ({
                board: {
                    ...state.board,
                    columns: state.board.columns.map(col =>
                        col.id === columnId
                            ? {
                                ...col,
                                cards: [...col.cards, clonedCard]
                                    .sort((a, b) => (a.rank || '').localeCompare(b.rank || ''))
                            }
                            : col
                    )
                }
            }));

            return clonedCard;
        } catch (err) {
            console.error('cloneCard error:', err);
            throw err;
        }
    },
}));