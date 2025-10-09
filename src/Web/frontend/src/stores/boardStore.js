import { create } from 'zustand';
import { apiService } from '~/services/api';
import { toast } from 'react-toastify';

// Helper functions
const makeTempId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID)
        return `temp-${crypto.randomUUID()}`;
    return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
};

const dedupeById = (arr = []) => {
    const seen = new Set();
    return arr.filter(item => {
        if (!item) return false;
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

const ensureUniqueOrder = (arr = []) => Array.from(new Set(arr));

const findColumn = (columns = [], columnId) =>
    columns.find(c => c.id === columnId);

const updateCardInColumns = (columns = [], columnId, cardId, updatedCard) =>
    columns.map(c =>
        c.id === columnId
            ? { ...c, cards: (c.cards || []).map(card => card.id === cardId ? updatedCard : card) }
            : c
    );

const addCardToColumn = (columns = [], columnId, card, atIndex = null) =>
    columns.map(c => {
        if (c.id !== columnId) return c;
        const cards = [...(c.cards || [])];
        if (atIndex == null) cards.push(card);
        else cards.splice(Math.max(0, Math.min(atIndex, cards.length)), 0, card);
        return {
            ...c,
            cards: dedupeById(cards),
            cardOrderIds: ensureUniqueOrder((c.cardOrderIds || []).concat(card.id))
        };
    });

const removeCardFromColumns = (columns = [], columnId, cardId) =>
    columns.map(c =>
        c.id === columnId
            ? {
                ...c,
                cards: (c.cards || []).filter(card => card.id !== cardId),
                cardOrderIds: (c.cardOrderIds || []).filter(id => id !== cardId)
            }
            : c
    );

const replaceColumn = (columns = [], newColumn) =>
    columns.map(c => (c.id === newColumn.id ? newColumn : c));

const removeColumnById = (columns = [], columnId) =>
    columns.filter(c => c.id !== columnId);

const moveCardInState = (columns = [], fromColumnId, toColumnId, cardId, newIndex) => {
    const from = findColumn(columns, fromColumnId);
    const to = findColumn(columns, toColumnId);
    if (!from || !to) return columns;

    const card = (from.cards || []).find(c => c.id === cardId);
    if (!card) return columns;

    return columns.map(c => {
        if (c.id === fromColumnId) {
            return {
                ...c,
                cards: (c.cards || []).filter(x => x.id !== cardId),
                cardOrderIds: (c.cardOrderIds || []).filter(id => id !== cardId)
            };
        }
        if (c.id === toColumnId) {
            const newCards = [...(c.cards || [])];
            const insertAt = Math.max(0, Math.min(newIndex, newCards.length));
            newCards.splice(insertAt, 0, { ...card, columnId: toColumnId });
            return {
                ...c,
                cards: dedupeById(newCards),
                cardOrderIds: newCards.map(x => x.id)
            };
        }
        return c;
    });
};

// Zustand Store
export const useBoardStore = create((set, get) => ({
    // State
    board: null,
    loading: false,
    error: null,
    pendingTempIds: new Set(),
    currentUser: null,
    boardId: null,

    // Actions
    setBoardId: (boardId) => set({ boardId }),

    setCurrentUser: (user) => set({ currentUser: user }),

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error }),

    // Load board
    loadBoard: async (boardId) => {
        set({ loading: true, error: null });
        try {
            const result = await apiService.getBoard(boardId);
            if (result) {
                set({
                    board: result || { columns: [], columnOrderIds: [] },
                    currentUser: result?.currentUser ?? get().currentUser,
                    loading: false
                });
            } else {
                set({
                    board: { columns: [], columnOrderIds: [] },
                    loading: false
                });
            }
        } catch (error) {
            set({
                error: error.message,
                loading: false,
                board: { columns: [], columnOrderIds: [] }
            });
        }
    },

    // Create Column
    createColumn: async (columnData) => {
        const { board, boardId, pendingTempIds } = get();
        const tempId = makeTempId();
        const tempColumn = { ...columnData, id: tempId, cards: [], cardOrderIds: [] };

        // Optimistic update
        set({
            board: {
                ...board,
                columns: [...(board?.columns || []), tempColumn],
                columnOrderIds: [...(board?.columnOrderIds || []), tempId]
            },
            pendingTempIds: new Set([...pendingTempIds, tempId])
        });

        try {
            const payload = { ...columnData, clientTempId: tempId };
            const result = await apiService.createColumn(boardId, payload);

            // Remove from pending
            const newPending = new Set(get().pendingTempIds);
            newPending.delete(tempId);

            if (result) {
                const real = result;
                set((state) => {
                    const cols = state.board?.columns || [];
                    const filtered = cols.filter(c => c.id !== tempId && c.id !== real.id);
                    const tempIndex = cols.findIndex(c => c.id === tempId);
                    if (tempIndex !== -1) filtered.splice(tempIndex, 0, real);
                    else filtered.push(real);

                    const newOrder = (state.board?.columnOrderIds || [])
                        .map(id => id === tempId ? real.id : id)
                        .filter((id, idx, arr) => arr.indexOf(id) === idx);

                    return {
                        board: { ...state.board, columns: filtered, columnOrderIds: newOrder },
                        pendingTempIds: newPending
                    };
                });
                return result;
            }
        } catch {
            // Rollback
            const newPending = new Set(get().pendingTempIds);
            newPending.delete(tempId);

            set((state) => ({
                board: {
                    ...state.board,
                    columns: (state.board?.columns || []).filter(c => c.id !== tempId),
                    columnOrderIds: (state.board?.columnOrderIds || []).filter(id => id !== tempId)
                },
                pendingTempIds: newPending
            }));
            toast.error('Tạo column thất bại');
        }
        return null;
    },

    // Update Column
    updateColumn: async (columnId, updateData) => {
        const { board, boardId } = get();
        const snapshot = board;
        const originalColumn = snapshot?.columns?.find(c => c.id === columnId) || {};
        const optimisticColumn = { ...originalColumn, ...updateData };

        // Optimistic update
        set({
            board: {
                ...board,
                columns: replaceColumn(board?.columns || [], optimisticColumn)
            }
        });

        try {
            await apiService.updateColumn(boardId, columnId, updateData);
            return true;
        } catch {
            // Rollback
            set({ board: snapshot });
            toast.error('Cập nhật column thất bại — đã khôi phục trạng thái.');
            return false;
        }
    },

    // Delete Column
    deleteColumn: async (columnId) => {
        const { boardId } = get();
        try {
            await apiService.deleteColumn(boardId, columnId);
            set((state) => ({
                board: {
                    ...state.board,
                    columns: removeColumnById(state.board?.columns || [], columnId),
                    columnOrderIds: (state.board?.columnOrderIds || []).filter(id => id !== columnId)
                }
            }));
            return true;
        } catch {
            return false;
        }
    },

    // Create Card
    createCard: async (columnId, cardData) => {
        const { board, boardId, pendingTempIds } = get();
        const tempId = makeTempId();
        const tempCard = { ...cardData, id: tempId };

        // Optimistic update
        set({
            board: {
                ...board,
                columns: addCardToColumn(board?.columns || [], columnId, tempCard)
            },
            pendingTempIds: new Set([...pendingTempIds, tempId])
        });

        try {
            const payload = { ...cardData, clientTempId: tempId };
            const result = await apiService.createCard(boardId, columnId, payload);

            const newPending = new Set(get().pendingTempIds);
            newPending.delete(tempId);

            if (result) {
                const real = result;
                set((state) => {
                    const cols = state.board?.columns || [];
                    return {
                        board: {
                            ...state.board,
                            columns: cols.map(col => {
                                if (col.id !== columnId) return col;
                                const cards = col.cards || [];
                                const tempIndex = cards.findIndex(c => c.id === tempId);
                                const filtered = cards.filter(c => c.id !== tempId && c.id !== real.id);
                                if (tempIndex !== -1) filtered.splice(tempIndex, 0, real);
                                else filtered.push(real);

                                let newOrder = (col.cardOrderIds || []).map(id => id === tempId ? real.id : id);
                                if (!newOrder.includes(real.id)) newOrder.push(real.id);
                                newOrder = ensureUniqueOrder(newOrder);

                                return {
                                    ...col,
                                    cards: dedupeById(filtered),
                                    cardOrderIds: newOrder
                                };
                            })
                        },
                        pendingTempIds: newPending
                    };
                });
                return result;
            }
        } catch {
            // Rollback
            const newPending = new Set(get().pendingTempIds);
            newPending.delete(tempId);

            set((state) => ({
                board: {
                    ...state.board,
                    columns: removeCardFromColumns(state.board?.columns || [], columnId, tempId)
                },
                pendingTempIds: newPending
            }));
            toast.error('Tạo card thất bại');
        }
        return null;
    },

    // Update Card
    updateCard: async (columnId, cardId, updateData) => {
        const { board, boardId } = get();
        const snapshot = board;
        const originalCard = snapshot?.columns
            ?.find(c => c.id === columnId)?.cards
            ?.find(x => x.id === cardId) || {};
        const optimisticCard = { ...originalCard, ...updateData };

        // Optimistic update
        set({
            board: {
                ...board,
                columns: updateCardInColumns(board?.columns || [], columnId, cardId, optimisticCard)
            }
        });

        try {
            await apiService.updateCard(boardId, columnId, cardId, updateData);
            return true;
        } catch {
            // Rollback
            set({ board: snapshot });
            toast.error('Cập nhật card thất bại — đã khôi phục trạng thái.');
            return false;
        }
    },

    // Delete Card
    deleteCard: async (columnId, cardId) => {
        const { board, boardId } = get();
        const snapshot = board;
        const removedCard = snapshot?.columns
            ?.find(c => c.id === columnId)?.cards
            ?.find(card => card.id === cardId) || null;

        // Optimistic remove
        set((state) => ({
            board: {
                ...state.board,
                columns: (state.board?.columns || []).map(c =>
                    c.id === columnId
                        ? {
                            ...c,
                            cards: (c.cards || []).filter(card => card.id !== cardId),
                            cardOrderIds: (c.cardOrderIds || []).filter(id => id !== cardId)
                        }
                        : c
                )
            }
        }));

        try {
            await apiService.deleteCard(boardId, columnId, cardId);
            return true;
        } catch {
            // Rollback
            if (removedCard) {
                set((state) => ({
                    board: {
                        ...state.board,
                        columns: (state.board?.columns || []).map(c => {
                            if (c.id !== columnId) return c;
                            const exists = (c.cards || []).some(x => x.id === removedCard.id);
                            if (exists) return c;
                            return {
                                ...c,
                                cards: dedupeById([...(c.cards || []), removedCard]),
                                cardOrderIds: ensureUniqueOrder([...(c.cardOrderIds || []), removedCard.id])
                            };
                        })
                    }
                }));
            } else {
                await get().loadBoard(boardId);
            }
            toast.error('Xóa card thất bại — đã khôi phục trạng thái.');
            return false;
        }
    },

    // Move Card
    moveCard: async (fromColumnId, toColumnId, cardId, positionIndex) => {
        const { board, boardId } = get();
        const snapshot = board;

        // Optimistic move
        set({
            board: {
                ...board,
                columns: moveCardInState(board?.columns || [], fromColumnId, toColumnId, cardId, positionIndex)
            }
        });

        try {
            await apiService.moveCard(boardId, fromColumnId, cardId, {
                fromColumnId,
                toColumnId,
                newIndex: positionIndex
            });
            return true;
        } catch {
            // Rollback
            set({ board: snapshot });
            toast.error('Di chuyển card thất bại — đã khôi phục trạng thái.');
            return false;
        }
    },

    // Reorder Columns
    reorderColumns: async (columnOrderIds) => {
        const { boardId } = get();
        try {
            await apiService.reorderColumns(boardId, columnOrderIds);
            return true;
        } catch {
            return false;
        }
    },

    // Reorder Cards
    reorderCards: async (columnId, cardOrderIds) => {
        const { boardId } = get();
        try {
            await apiService.reorderCards(boardId, columnId, cardOrderIds);
            return true;
        } catch {
            return false;
        }
    },

    // Assign Card Member
    assignCardMember: async (columnId, cardId, memberEmail) => {
        const { board, boardId } = get();
        const snapshot = board;

        const card = snapshot?.columns
            ?.find(c => c.id === columnId)?.cards
            ?.find(x => x.id === cardId);

        if (!card) {
            toast.error('Không tìm thấy card để gán thành viên.');
            return false;
        }

        const tempMember = { email: memberEmail, isTemp: true };
        const optimisticCard = {
            ...card,
            members: [...(card.members || []), tempMember]
        };

        // Optimistic update
        set({
            board: {
                ...board,
                columns: updateCardInColumns(board?.columns || [], columnId, cardId, optimisticCard)
            }
        });

        try {
            const result = await apiService.assignCardMember(boardId, columnId, cardId, memberEmail);
            if (result) {
                const updatedCard = result;
                set((state) => ({
                    board: {
                        ...state.board,
                        columns: updateCardInColumns(state.board?.columns || [], columnId, cardId, updatedCard)
                    }
                }));
                toast.success('Đã gán thành viên vào card.');
                return true;
            }
        } catch {
            // Rollback
            set({ board: snapshot });
            toast.error('Gán thành viên thất bại — đã khôi phục trạng thái.');
            return false;
        }
    },

    // Unassign Card Member
    unassignCardMember: async (columnId, cardId, memberId) => {
        const { board, boardId } = get();
        const snapshot = board;

        const card = snapshot?.columns
            ?.find(c => c.id === columnId)?.cards
            ?.find(x => x.id === cardId);

        console.log('card ', card)

        if (!card) {
            toast.error('Không tìm thấy card để gỡ thành viên.');
            return false;
        }

        const optimisticCard = {
            ...card,
            members: (card.members || []).filter(m => m.id !== memberId)
        };

        console.log('optimisticCard ', optimisticCard)

        // Optimistic update
        set({
            board: {
                ...board,
                columns: updateCardInColumns(board?.columns || [], columnId, cardId, optimisticCard)
            }
        });

        try {
            await apiService.unassignCardMember(boardId, columnId, cardId, memberId);
            toast.info('Đã gỡ thành viên khỏi card.');
            return true;
        } catch {
            // Rollback
            set({ board: snapshot });
            toast.error('Gỡ thành viên thất bại — đã khôi phục trạng thái.');
            return false;
        }
    },

    // SignalR handlers
    handleColumnCreated: (data) => {
        const { column, userId, clientTempId } = data;
        const { currentUser } = get();

        if (userId === currentUser?.id) return;

        set((state) => {
            const cols = state.board?.columns || [];
            if (cols.some(c => c.id === column.id)) return state;

            if (clientTempId && cols.some(c => c.id === clientTempId)) {
                const replaced = cols.map(c => c.id === clientTempId ? column : c);
                const newOrder = (state.board?.columnOrderIds || [])
                    .map(id => id === clientTempId ? column.id : id);
                return {
                    board: {
                        ...state.board,
                        columns: replaced,
                        columnOrderIds: ensureUniqueOrder(newOrder)
                    }
                };
            }

            const newCols = dedupeById([...cols, column]);
            const newOrder = ensureUniqueOrder([...(state.board?.columnOrderIds || []), column.id]);
            return {
                board: {
                    ...state.board,
                    columns: newCols,
                    columnOrderIds: newOrder
                }
            };
        });

        toast.success(`New column "${column.title}" created`);
    },

    handleColumnUpdated: (data) => {
        const { column, userId } = data;
        const { currentUser } = get();

        if (userId === currentUser?.id) return;

        set((state) => ({
            board: {
                ...state.board,
                columns: replaceColumn(state.board?.columns || [], column)
            }
        }));
    },

    handleColumnDeleted: (data) => {
        const { columnId, userId } = data;
        const { currentUser } = get();

        if (userId === currentUser?.id) return;

        set((state) => ({
            board: {
                ...state.board,
                columns: removeColumnById(state.board?.columns || [], columnId),
                columnOrderIds: (state.board?.columnOrderIds || []).filter(id => id !== columnId)
            }
        }));
        toast.info('A column was deleted');
    },

    handleColumnsReordered: (data) => {
        const { columnOrderIds, userId } = data;
        const { currentUser } = get();

        if (userId === currentUser?.id) return;

        set((state) => {
            const reorderedColumns = columnOrderIds
                .map(id => state.board?.columns?.find(col => col.id === id))
                .filter(Boolean);
            return {
                board: {
                    ...state.board,
                    columns: reorderedColumns,
                    columnOrderIds
                }
            };
        });
    },

    handleCardCreated: (data) => {
        const { card, columnId, userId, clientTempId } = data;
        const { currentUser } = get();

        if (userId === currentUser?.id) return;

        set((state) => {
            const cols = state.board?.columns || [];
            const col = findColumn(cols, columnId);
            if (!col) return state;

            if ((col.cards || []).some(c => c.id === card.id)) return state;

            if (clientTempId && (col.cards || []).some(c => c.id === clientTempId)) {
                return {
                    board: {
                        ...state.board,
                        columns: cols.map(c => {
                            if (c.id !== columnId) return c;
                            const newCards = (c.cards || []).map(x => x.id === clientTempId ? card : x);
                            const newOrder = (c.cardOrderIds || []).map(id => id === clientTempId ? card.id : id);
                            return {
                                ...c,
                                cards: dedupeById(newCards),
                                cardOrderIds: ensureUniqueOrder(newOrder)
                            };
                        })
                    }
                };
            }

            return {
                board: {
                    ...state.board,
                    columns: cols.map(c =>
                        c.id === columnId
                            ? {
                                ...c,
                                cards: dedupeById([...(c.cards || []), card]),
                                cardOrderIds: ensureUniqueOrder([...(c.cardOrderIds || []), card.id])
                            }
                            : c
                    )
                }
            };
        });

        toast.success(`New card "${card.title}" created`);
    },

    handleCardUpdated: (data) => {
        const { card, columnId, userId } = data;
        const { currentUser } = get();

        if (userId === currentUser?.id) return;

        set((state) => ({
            board: {
                ...state.board,
                columns: updateCardInColumns(state.board?.columns || [], columnId, card.id, card)
            }
        }));
    },

    handleCardDeleted: (data) => {
        const { cardId, columnId, userId } = data;
        const { currentUser } = get();

        if (userId === currentUser?.id) return;

        set((state) => ({
            board: {
                ...state.board,
                columns: removeCardFromColumns(state.board?.columns || [], columnId, cardId)
            }
        }));
    },

    handleCardsReordered: (data) => {
        const { columnId, cardOrderIds, userId } = data;
        const { currentUser } = get();

        if (userId === currentUser?.id) return;

        set((state) => ({
            board: {
                ...state.board,
                columns: (state.board?.columns || []).map(col => {
                    if (col.id === columnId) {
                        const reorderedCards = cardOrderIds
                            .map(id => col.cards?.find(card => card.id === id))
                            .filter(Boolean);
                        return { ...col, cards: reorderedCards, cardOrderIds };
                    }
                    return col;
                })
            }
        }));
    },

    handleCardMoved: (data) => {
        const { cardId, fromColumnId, toColumnId, newIndex, userId } = data;
        const { currentUser } = get();

        if (userId === currentUser?.id) return;

        set((state) => ({
            board: {
                ...state.board,
                columns: moveCardInState(
                    state.board?.columns || [],
                    fromColumnId,
                    toColumnId,
                    cardId,
                    newIndex
                )
            }
        }));
    },

    handleCardAssigned: (data) => {
        const { columnId, card, userId } = data;
        const { currentUser } = get();
        console.log(currentUser)

        if (userId === currentUser?.id) return;

        set((state) => {
            const columns = state.board?.columns || [];
            const updatedColumns = columns.map(col => {
                if (col.id !== columnId) return col;

                const updatedCards = (col.cards || []).map(c => {
                    if (c.id !== card.id) return c;

                    // merge members
                    const existingMembers = c.members || [];
                    const newMembers = card.members || [];
                    // Gộp mà không trùng (theo member.id hoặc member.userId)
                    const mergedMembers = [...existingMembers];
                    newMembers.forEach(m => {
                        const exists = mergedMembers.some(em =>
                            em.id === m.id ||
                            em.userId === m.userId ||
                            em.user?.id === m.user?.id
                        );
                        if (!exists) mergedMembers.push(m);
                    });

                    return {
                        ...c,
                        ...card,
                        members: mergedMembers
                    };
                });

                return { ...col, cards: updatedCards };
            });

            return {
                board: { ...state.board, columns: updatedColumns }
            };
        });


        const assignedMember = card.members?.[card.members.length - 1]?.user;
        const name = assignedMember?.userName || 'Ai đó';

        toast.info(`${name} vừa được gán vào thẻ "${card.title}"`);
    },

    handleCardUnassigned: (data) => {
        const { columnId, card, unassignedUserId, userId } = data;
        const { currentUser } = get();

        if (userId === currentUser?.id) return;

        set((state) => {
            // nếu server trả về card đã được cập nhật (không chứa member bị gỡ), dùng trực tiếp
            // nhưng phòng trường hợp server chưa loại member (edge case), chúng ta đảm bảo loại member theo unassignedUserId
            const columns = (state.board?.columns || []).map(col => {
                if (col.id !== columnId) return col;

                const cards = (col.cards || []).map(c => {
                    if (c.id !== card.id) return c;

                    // Build a safeCard: start from server card, but force-filter members by userId (unassignedUserId)
                    const filteredMembers = (card.members || []).filter(m => {
                        const memberUserId = m?.userId ?? m?.user?.id ?? m?.user?.userId ?? null;
                        // keep member if not equal to unassignedUserId
                        if (!memberUserId) return true;
                        return String(memberUserId) !== String(unassignedUserId);
                    });

                    return {
                        ...card,
                        // use filtered members to be safe
                        members: filteredMembers
                    };
                });

                return {
                    ...col,
                    cards
                };
            });

            return {
                board: {
                    ...state.board,
                    columns
                }
            };
        });

        // Toast: tìm tên người bị gỡ từ board.members (nếu có) — fallback "Ai đó"
        const board = get().board;
        let name = 'Ai đó';
        const bm = board?.members?.find(bm => {
            const bUserId = bm?.user?.id ?? bm?.userId ?? null;
            return bUserId && String(bUserId) === String(unassignedUserId);
        });
        if (bm) name = bm.user?.userName ?? bm.userName ?? name;

        toast.info(`${name} vừa bị gỡ khỏi "${card.title}"`);
    },

}));