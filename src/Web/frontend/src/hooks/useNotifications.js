import { useState, useEffect, useCallback } from 'react';
import { apiService } from '~/services/api';
import { useAuth } from './useAuth';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

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
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
      );
      
      // Update summary
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
      
      // Update local state
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
      
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setSummary(prev => prev ? { ...prev, totalCount: prev.totalCount - 1 } : null);
      
      return true;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  }, []);

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