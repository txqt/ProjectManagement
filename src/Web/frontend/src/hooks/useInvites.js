import { useState, useEffect, useCallback } from 'react';
import { apiService } from '~/services/api';
import { useAuth } from './useAuth';

export const useInvites = () => {
  const [myInvites, setMyInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const loadMyInvites = useCallback(async (status = null) => {
    try {
      setLoading(true);
      const response = await apiService.getMyInvites(status);
      setMyInvites(response);
      setError(null);
    } catch (error) {
      console.error('Failed to load invites:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const respondToInvite = useCallback(async (inviteId, response) => {
    try {
      const result = await apiService.respondToInvite(inviteId, response);

      if (result.success) {
        // Update local state
        setMyInvites(prev =>
          prev.map(invite =>
            invite.id === inviteId
              ? { ...invite, status: response === 'accept' ? 'accepted' : 'declined', respondedAt: new Date().toISOString() }
              : invite
          )
        );
      }

      return result;
    } catch (error) {
      console.error('Failed to respond to invite:', error);
      return { success: false, message: error.message };
    }
  }, []);

  const createBoardInvite = useCallback(async (boardId, inviteData) => {
    try {
      const result = await apiService.createBoardInvite(boardId, inviteData);
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to create invite:', error);
      return { success: false, message: error.message };
    }
  }, []);

  const loadBoardInvites = useCallback(async (boardId, status = 'pending') => {
    try {
      return await apiService.getBoardInvites(boardId, status);
    } catch (error) {
      console.error('Failed to load board invites:', error);
      throw error;
    }
  }, []);

  const cancelInvite = useCallback(async (boardId, inviteId) => {
    try {
      await apiService.cancelInvite(boardId, inviteId);
      return { success: true };
    } catch (error) {
      console.error('Failed to cancel invite:', error);
      return { success: false, message: error.message };
    }
  }, []);

  const resendInvite = useCallback(async (boardId, inviteId) => {
    try {
      await apiService.resendInvite(boardId, inviteId);
      return { success: true };
    } catch (error) {
      console.error('Failed to resend invite:', error);
      return { success: false, message: error.message };
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadMyInvites();
    }
  }, [user, loadMyInvites]);

  return {
    myInvites,
    loading,
    error,
    loadMyInvites,
    respondToInvite,
    createBoardInvite,
    loadBoardInvites,
    cancelInvite,
    resendInvite
  };
};