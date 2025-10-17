import { create } from 'zustand';
import { apiService } from '~/services/api';

export const usePermissionStore = create((set, get) => ({
  permissions: null,
  loading: false,
  lastFetched: 0,
  // TTL để tránh gọi quá dày (ví dụ 60s)
  ttlMs: 60 * 1000,

  loadPermissions: async () => {
    const { loading, lastFetched, ttlMs } = get();
    if (loading) return;
    const now = Date.now();
    if (get().permissions && (now - lastFetched) < ttlMs) return;

    set({ loading: true });
    try {
      const response = await apiService.getMyPermissions();
      set({ permissions: response, lastFetched: Date.now() });
    } catch (err) {
      console.error('loadPermissions failed', err);
      set({ permissions: null });
    } finally {
      set({ loading: false });
    }
  },

  refreshPermissions: async () => {
    set({ lastFetched: 0 });
    await get().loadPermissions();
  }
}));
