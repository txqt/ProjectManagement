import { useState, useEffect, useCallback } from 'react';
import { apiService } from '~/services/api';
import { useAuth } from './useAuth';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadPermissions();
    }
  }, [user]);

  const loadPermissions = async () => {
    try {
      const response = await apiService.getMyPermissions();
      setPermissions(response);
    } catch (error) {
      console.error('Failed to load permissions:', error);
      setPermissions(null);
    } finally {
      setLoading(false);
    }
  };

  const hasSystemPermission = useCallback((permission) => {
    if (!permissions) return false;
    return permissions.systemPermissions.includes(permission);
  }, [permissions]);

  const hasBoardPermission = useCallback((boardId, permission) => {
    if (!permissions || !boardId) return false;
    const boardPerms = permissions.boardPermissions[boardId];
    return boardPerms ? boardPerms.includes(permission) : false;
  }, [permissions]);

  const checkBoardPermission = useCallback(async (boardId, permission) => {
    try {
      const response = await apiService.checkBoardPermission(boardId, permission);
      return response.hasPermission;
    } catch (error) {
      console.error('Failed to check board permission:', error);
      return false;
    }
  }, []);

  const canCreateBoard = useCallback(() => {
    return hasSystemPermission('boards.create');
  }, [hasSystemPermission]);

  const canEditBoard = useCallback((boardId) => {
    return hasBoardPermission(boardId, 'boards.edit');
  }, [hasBoardPermission]);

  const canDeleteBoard = useCallback((boardId) => {
    return hasBoardPermission(boardId, 'boards.delete');
  }, [hasBoardPermission]);

  const canManageBoardMembers = useCallback((boardId) => {
    return hasBoardPermission(boardId, 'boards.manage_members');
  }, [hasBoardPermission]);

  const canCreateColumn = useCallback((boardId) => {
    return hasBoardPermission(boardId, 'columns.create');
  }, [hasBoardPermission]);

  const canEditColumn = useCallback((boardId) => {
    return hasBoardPermission(boardId, 'columns.edit');
  }, [hasBoardPermission]);

  const canDeleteColumn = useCallback((boardId) => {
    return hasBoardPermission(boardId, 'columns.delete');
  }, [hasBoardPermission]);

  const canCreateCard = useCallback((boardId) => {
    return hasBoardPermission(boardId, 'cards.create');
  }, [hasBoardPermission]);

  const canEditCard = useCallback((boardId) => {
    return hasBoardPermission(boardId, 'cards.edit');
  }, [hasBoardPermission]);

  const canDeleteCard = useCallback((boardId) => {
    return hasBoardPermission(boardId, 'cards.delete');
  }, [hasBoardPermission]);

  const canMoveCard = useCallback((boardId) => {
    return hasBoardPermission(boardId, 'cards.move');
  }, [hasBoardPermission]);

  const isSystemAdmin = useCallback(() => {
    return hasSystemPermission('system.view_all_users') || 
           hasSystemPermission('system.manage_users');
  }, [hasSystemPermission]);

  return {
    permissions,
    loading,
    hasSystemPermission,
    hasBoardPermission,
    checkBoardPermission,
    canCreateBoard,
    canEditBoard,
    canDeleteBoard,
    canManageBoardMembers,
    canCreateColumn,
    canEditColumn,
    canDeleteColumn,
    canCreateCard,
    canEditCard,
    canDeleteCard,
    canMoveCard,
    isSystemAdmin,
    refreshPermissions: loadPermissions
  };
};