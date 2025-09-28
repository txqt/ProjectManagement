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
        
        // Connect to SignalR hub
        await signalRService.connect(token);
        
        // Leave previous board if any
        if (boardIdRef.current && boardIdRef.current !== boardId) {
          await signalRService.leaveBoard(boardIdRef.current);
        }
        
        // Join new board
        await signalRService.joinBoard(boardId);
        boardIdRef.current = boardId;
        
        // Try get snapshot users from service cache or invoke directly
        let snapshot = signalRService.getCachedUsersForBoard(boardId);
        if (!snapshot || snapshot.length === 0) {
          // fallback: call hub method
          try {
            snapshot = await signalRService.getUsersInBoard(boardId);
          } catch {
            snapshot = [];
          }
        }
        setUsers(snapshot || []);
        
        // Register snapshot listener so we update users if service refreshes it (e.g. after reconnect)
        signalRService.onUsersInBoard((usersArr) => {
          setUsers(usersArr || []);
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
      // Cleanup khi unmount hoặc boardId change
      if (boardIdRef.current) {
        signalRService.leaveBoard(boardIdRef.current)
          .catch(err => console.error('Leave board error:', err));
      }
      boardIdRef.current = null;
      setIsConnected(false);
      setUsers([]);
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