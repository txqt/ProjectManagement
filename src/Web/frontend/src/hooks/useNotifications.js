import { useState, useEffect, useCallback } from 'react';
import { apiService } from '~/services/api';
import { signalRService } from '~/services/signalRService';
import { useAuth } from './useAuth';
import { toast } from 'react-toastify';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, token } = useAuth();

  const loadNotifications = useCallback(async (skip = 0, take = 20, unreadOnly = null) => {
    try {
      setLoading(true);
      const response = await apiService.getNotifications(skip, take, unreadOnly);
      setNotifications(prev => skip === 0 ? response : [...prev, ...response]);
      setError(null);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const response = await apiService.getNotificationSummary();
      setSummary(response);
    } catch (error) {
      console.error('Failed to load notification summary:', error);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
      );
      
      setSummary(prev => prev ? { ...prev, unreadCount: Math.max(0, prev.unreadCount - 1) } : null);
      
      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      
      setSummary(prev => prev ? { ...prev, unreadCount: 0 } : null);
      
      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await apiService.deleteNotification(notificationId);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setSummary(prev => prev ? { ...prev, totalCount: prev.totalCount - 1 } : null);
      
      return true;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  }, []);

  // Setup SignalR for realtime notifications
  useEffect(() => {
    if (!user || !token) return;

    const setupSignalR = async () => {
      try {
        await signalRService.connect(token);

        // Listen for new notifications
        signalRService.onNotificationReceived((notification) => {
          // Add to notifications list
          setNotifications(prev => [notification, ...prev]);
          
          // Update summary
          setSummary(prev => prev ? {
            ...prev,
            unreadCount: prev.unreadCount + 1,
            totalCount: prev.totalCount + 1
          } : null);

          // Show toast
          toast.info(notification.message, {
            position: 'bottom-right',
            autoClose: 5000,
            onClick: () => {
              if (notification.actionUrl) {
                window.location.href = notification.actionUrl;
              }
            }
          });
        });

        // Listen for notification read events (from other devices)
        signalRService.onNotificationRead((data) => {
          const { notificationId } = data;
          setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
          );
          setSummary(prev => prev ? { ...prev, unreadCount: Math.max(0, prev.unreadCount - 1) } : null);
        });

        // Listen for notification deleted events
        signalRService.onNotificationDeleted((data) => {
          const { notificationId } = data;
          setNotifications(prev => prev.filter(n => n.id !== notificationId));
          setSummary(prev => prev ? { ...prev, totalCount: Math.max(0, prev.totalCount - 1) } : null);
        });

      } catch (error) {
        console.error('SignalR setup error:', error);
      }
    };

    setupSignalR();

    return () => {
      // Cleanup listeners when component unmounts
      signalRService._removeListener?.('NotificationReceived');
      signalRService._removeListener?.('NotificationRead');
      signalRService._removeListener?.('NotificationDeleted');
    };
  }, [user, token]);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadNotifications();
      loadSummary();
    }
  }, [user, loadNotifications, loadSummary]);

  return {
    notifications,
    summary,
    loading,
    error,
    loadNotifications,
    loadSummary,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: () => loadNotifications(0, 20)
  };
};