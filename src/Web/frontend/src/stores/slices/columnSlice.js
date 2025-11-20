import { apiService } from '~/services/api';
import { sortByRank } from './stateHelpers';

export const createColumnSlice = (set, get) => ({
    pendingTempIds: new Set(),

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
                    columns: sortByRank(state.board.columns.map(col =>
                        col.id === tempId ? newColumn : col
                    ))
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
            const updated = await apiService.updateColumn(get().boardId, columnId, updateColumnDto);
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

    reorderColumns: async (columnIds) => {
        const originalBoard = get().board;

        set(state => {
            const orderMap = new Map(columnIds.map((id, idx) => [id, idx]));

            const newColumns = state.board.columns
                .slice()
                .sort((a, b) => {
                    const ia = orderMap.has(a.id) ? orderMap.get(a.id) : Number.MAX_SAFE_INTEGER;
                    const ib = orderMap.has(b.id) ? orderMap.get(b.id) : Number.MAX_SAFE_INTEGER;
                    return ia - ib;
                })
                .map(col => {
                    if (orderMap.has(col.id)) {
                        return { ...col, rank: String(orderMap.get(col.id)).padStart(6, '0') };
                    }
                    return col;
                });

            return {
                board: {
                    ...state.board,
                    columns: newColumns
                }
            };
        });

        try {
            await apiService.reorderColumns(get().boardId, columnIds);
        } catch (err) {
            set({ board: originalBoard });
            throw err;
        }
    },

    cloneColumn: async (columnId, cloneData) => {
        const boardId = get().boardId;
        if (!boardId) throw new Error('No board selected');

        try {
            const clonedColumn = await apiService.cloneColumn(boardId, columnId, cloneData);

            set(state => ({
                board: {
                    ...state.board,
                    columns: sortByRank([...state.board.columns, clonedColumn])
                }
            }));

            return clonedColumn;
        } catch (err) {
            console.error('cloneColumn error:', err);
            throw err;
        }
    },

    // SignalR handlers
    handleColumnCreated: (data) => {
        set(state => ({
            board: {
                ...state.board,
                columns: sortByRank([...state.board.columns, data.column])
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
            set(state => {
                const existingColumnsMap = new Map();
                state.board.columns.forEach(col => {
                    existingColumnsMap.set(col.id, col);
                });

                const mergedColumns = data.orderedColumns.map(serverCol => {
                    const existingCol = existingColumnsMap.get(serverCol.id);

                    if (existingCol) {
                        return {
                            ...existingCol,
                            rank: serverCol.rank,
                            title: serverCol.title ?? existingCol.title,
                            cards: existingCol.cards
                        };
                    }

                    return serverCol;
                });

                return {
                    board: {
                        ...state.board,
                        columns: mergedColumns
                    }
                };
            });
            console.log('Columns updated from server event.');
        }
    },
});
