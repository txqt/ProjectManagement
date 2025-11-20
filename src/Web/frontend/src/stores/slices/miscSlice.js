export const createMiscSlice = (set, get) => ({
    currentUser: null,
    joinRequests: [],

    setCurrentUser: (user) => set({ currentUser: user }),

    setJoinRequests: (joinRequests) => set({ joinRequests }),

    // SignalR handlers
    handleJoinRequestCreated: (data) => {
        console.log('handleJoinRequestCreated called with data:', data);
        try {
            const boardId = data?.boardId || data?.board?.id;
            const request = data?.request || data;

            if (!boardId || boardId !== get().boardId) return;

            set(state => ({
                joinRequests: [request, ...(state.joinRequests || [])]
            }));
        } catch (err) {
            console.error('handleJoinRequestCreated error', err);
        }
    },

    handleJoinRequestResponded: (data) => {
        try {
            const boardId = data?.boardId || data?.board?.id;
            const requestId = data?.requestId || data?.id;
            const status = (data?.status || '').toLowerCase();

            if (boardId && boardId !== get().boardId) return;

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

            if (status === 'approved') {
                const currentBoardId = get().boardId;
                if (currentBoardId) {
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

            if (!boardId || boardId !== get().boardId) return;

            // Activity logging doesn't need state updates currently
        } catch (err) {
            console.error('handleActivityLogged error', err);
        }
    },
});
