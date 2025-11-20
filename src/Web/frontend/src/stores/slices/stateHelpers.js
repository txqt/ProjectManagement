// Helper function to update nested card state
export const updateCardInState = (state, columnId, cardId, updater) => {
    return {
        ...state,
        board: {
            ...state.board,
            columns: state.board.columns.map(col =>
                col.id === columnId
                    ? {
                        ...col,
                        cards: col.cards.map(card =>
                            card.id === cardId ? updater(card) : card
                        )
                    }
                    : col
            )
        }
    };
};

// Helper function to update column in state
export const updateColumnInState = (state, columnId, updater) => {
    return {
        ...state,
        board: {
            ...state.board,
            columns: state.board.columns.map(col =>
                col.id === columnId ? updater(col) : col
            )
        }
    };
};

// Helper function to sort by rank
export const sortByRank = (items) => {
    return items.sort((a, b) => (a.rank || '').localeCompare(b.rank || ''));
};
