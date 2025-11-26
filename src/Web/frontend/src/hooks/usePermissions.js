// hooks/usePermissions.js
import { useEffect, useCallback } from 'react';
import { usePermissionStore } from '~/stores/permissionStore';
import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { user, token } = useAuth();
  const permissions = usePermissionStore(state => state.permissions);
  const loading = usePermissionStore(state => state.loading);
  const loadPermissions = usePermissionStore(state => state.loadPermissions);
  const refreshPermissions = usePermissionStore(state => state.refreshPermissions);

  useEffect(() => {
    if (token || user) {
      loadPermissions();
    }
  }, [token, user, loadPermissions]);

  const hasSystemPermission = useCallback((permission) => {
    if (!permissions) return false;
    return permissions.systemPermissions?.includes(permission);
  }, [permissions]);

  const hasBoardPermission = useCallback((boardId, permission) => {
    if (!permissions || !boardId) return false;
    const boardPerms = permissions.boardPermissions?.[boardId];
    return !!boardPerms && boardPerms.includes(permission);
  }, [permissions]);

  // ... các wrapper khác như before
  return {
    permissions,
    loading,
    hasSystemPermission,
    hasBoardPermission,
    refreshPermissions
    // thêm các tiện ích canCreateBoard... nếu cần
  };
};