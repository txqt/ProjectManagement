import { useEffect, useRef, useState } from 'react';
import { signalRService } from '~/services/signalRService';
import { useAuth } from './useAuth';

export const useSignalR = (boardId) => {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [users, setUsers] = useState([]); // <-- danh sách users cho board
  const boardIdRef = useRef(null);

  useEffect(() => {
    if (!token || !boardId || !user) return;

    const initializeConnection = async () => {
      try {
        setConnectionError(null);
        await signalRService.connect(token);

        if (boardIdRef.current && boardIdRef.current !== boardId) {
          await signalRService.leaveBoard(boardIdRef.current);
        }

        await signalRService.joinBoard(boardId);
        boardIdRef.current = boardId;

        let snapshot = signalRService.getCachedUsersForBoard(boardId);
        if (!snapshot || snapshot.length === 0) {
          try {
            snapshot = await signalRService.getUsersInBoard(boardId);
          } catch {
            snapshot = [];
          }
        }
        setUsers(snapshot || []);

        // snapshot listener
        signalRService.onUsersInBoard((usersArr) => {
          setUsers(usersArr || []);
        });

        // ALSO: listen to join/leave events so UI updates immediately.
        signalRService.onUserJoined((payload) => {
          // if payload contains boardId and matches OR only 1 board joined -> update
          const bid = payload?.boardId || (boardIdRef.current);
          if (bid !== boardIdRef.current) {
            // if not for this board, ignore
            return;
          }
          // try best-effort: update users directly
          setUsers(prev => {
            const arr = prev || [];
            if (!payload?.user) return arr;
            if (arr.some(u => u.id === payload.user.id)) return arr;
            return [...arr, payload.user];
          });
        });

        signalRService.onUserLeft((payload) => {
          const bid = payload?.boardId || (boardIdRef.current);
          if (bid !== boardIdRef.current) return;
          setUsers(prev => (prev || []).filter(u => u.id !== payload?.user?.id));
        });

        setIsConnected(true);
        console.log(`Joined board: ${boardId}`);
      } catch (error) {
        console.error('SignalR initialization error:', error);
        setConnectionError(error.message);
        setIsConnected(false);
      }
    };

    initializeConnection();

    return () => {
      if (boardIdRef.current) {
        signalRService.leaveBoard(boardIdRef.current)
          .catch(err => console.error('Leave board error:', err));
      }
      boardIdRef.current = null;
      setIsConnected(false);
      setUsers([]);
      // remove all listeners for this instance to avoid leaks
      signalRService.removeAllListeners?.();
    };
  }, [token, boardId, user]);

  // Cleanup khi component unmount hoàn toàn
  useEffect(() => {
    return () => {
      signalRService.removeAllListeners();
    };
  }, []);

  return {
    isConnected,
    connectionError,
    users, // <-- expose users để component sử dụng
    signalRService
  };
};