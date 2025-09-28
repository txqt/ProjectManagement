import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Button,
  Divider,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  NotificationsNone,
  Notifications,
  Check,
  Delete,
  CheckCircle
} from '@mui/icons-material';
import { useNotifications } from '~/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { notifications, summary, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId, event) => {
    event.stopPropagation();
    await markAsRead(notificationId);
  };

  const handleDelete = async (notificationId, event) => {
    event.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    
    handleClose();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'board_invite':
        return '📧';
      case 'card_assigned':
        return '📋';
      case 'comment_added':
        return '💬';
      case 'board_member_added':
        return '👥';
      default:
        return '📢';
    }
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton onClick={handleClick} sx={{ color: 'white' }}>
          <Badge badgeContent={summary?.unreadCount || 0} color="error">
            {summary?.unreadCount > 0 ? <Notifications /> : <NotificationsNone />}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ width: 400, maxHeight: 500 }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Notifications</Typography>
              {summary?.unreadCount > 0 && (
                <Button size="small" onClick={handleMarkAllAsRead}>
                  Mark all as read
                </Button>
              )}
            </Box>
            {summary && (
              <Typography variant="body2" color="text.secondary">
                {summary.unreadCount} unread of {summary.totalCount} total
              </Typography>
            )}
          </Box>

          <List sx={{ maxHeight: 400, overflow: 'auto', p: 0 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            ) : notifications.length === 0 ? (
              <ListItem>
                <ListItemText 
                  primary="No notifications"
                  secondary="You're all caught up!"
                />
              </ListItem>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    button
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                      '&:hover': { bgcolor: 'action.selected' }
                    }}
                  >
                    <Box sx={{ mr: 1, fontSize: '1.2em' }}>
                      {getNotificationIcon(notification.type)}
                    </Box>
                    
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography 
                            variant="body2" 
                            fontWeight={notification.isRead ? 'normal' : 'bold'}
                            sx={{ flex: 1 }}
                          >
                            {notification.title}
                          </Typography>
                          {!notification.isRead && (
                            <Box 
                              sx={{ 
                                width: 8, 
                                height: 8, 
                                borderRadius: '50%', 
                                bgcolor: 'primary.main' 
                              }} 
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </Typography>
                        </Box>
                      }
                    />

                    <Box display="flex" flexDirection="column" gap={0.5}>
                      {!notification.isRead && (
                        <Tooltip title="Mark as read">
                          <IconButton 
                            size="small" 
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                          >
                            <Check fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          onClick={(e) => handleDelete(notification.id, e)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))
            )}
          </List>

          {notifications.length > 10 && (
            <Box sx={{ p: 2, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
              <Button size="small" href="/notifications">
                View All Notifications
              </Button>
            </Box>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBell;