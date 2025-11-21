import { apiService } from '~/services/api';
import { sortByRank } from './stateHelpers';

export const createCardSlice = (set, get) => ({
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
                                cards: sortByRank(col.cards.map(card => (card.id === tempId ? newCard : card)))
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

    moveCard: async (fromColumnId, toColumnId, cardId, newIndex) => {
        const originalBoard = get().board;

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

    reorderCards: async (columnId, cardIds) => {
        const originalBoard = get().board;

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
            set({ board: originalBoard });
            throw err;
        }
    },

    assignCardMember: async (columnId, cardId, memberEmail) => {
        const success = await apiService.assignCardMember(get().boardId, columnId, cardId, memberEmail);
        if (success) {
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

    unassignCardMember: async (columnId, cardId, memberId) => {
        const success = await apiService.unassignCardMember(get().boardId, columnId, cardId, memberId);
        if (success) {
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
                                cards: sortByRank([...col.cards, clonedCard])
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

    // SignalR handlers
    handleCardCreated: (data) => {
        console.log('handleCardCreated')
        set(state => ({
            board: {
                ...state.board,
                columns: state.board.columns.map(col =>
                    col.id === data.columnId
                        ? {
                            ...col,
                            cards: sortByRank([...col.cards, data.card])
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

                const existingCardsMap = new Map();
                targetColumn.cards.forEach(card => {
                    existingCardsMap.set(card.id, card);
                });

                const mergedCards = data.orderedCards.map(serverCard => {
                    const existingCard = existingCardsMap.get(serverCard.id);

                    if (existingCard) {
                        return {
                            ...existingCard,
                            rank: serverCard.rank,
                            title: serverCard.title ?? existingCard.title,
                            description: serverCard.description ?? existingCard.description,
                            cover: serverCard.cover ?? existingCard.cover,
                        };
                    }

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

            const movedCard = sourceCol.cards.find(c => c.id === data.cardId);
            if (!movedCard) return state;

            return {
                board: {
                    ...state.board,
                    columns: state.board.columns.map(col => {
                        if (col.id === data.fromColumnId) {
                            return {
                                ...col,
                                cards: col.cards.filter(c => c.id !== data.cardId)
                            };
                        }

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
});
