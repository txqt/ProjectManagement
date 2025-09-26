import { useEffect, useRef, useState } from 'react';
import { signalRService } from '~/services/signalRService';
import { useAuth } from './useAuth';

export const useSignalR = (boardId) => {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
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
    signalRService
  };
};