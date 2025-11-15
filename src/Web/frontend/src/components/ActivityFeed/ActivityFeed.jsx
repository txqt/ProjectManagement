import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Divider,
  Button,
  Collapse
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  AddBox as AddBoxIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DriveFileMove as MoveIcon,
  Comment as CommentIcon,
  AttachFile as AttachFileIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { apiService } from '~/services/api';

// Activity icon mapping
const getActivityIcon = (action) => {
  const iconProps = { fontSize: 'small' };
  
  if (action === 'created') return <AddBoxIcon {...iconProps} color="success" />;
  if (action === 'updated') return <EditIcon {...iconProps} color="info" />;
  if (action === 'deleted') return <DeleteIcon {...iconProps} color="error" />;
  if (action === 'moved') return <MoveIcon {...iconProps} color="warning" />;
  if (action === 'commented') return <CommentIcon {...iconProps} color="primary" />;
  if (action === 'attached') return <AttachFileIcon {...iconProps} color="secondary" />;
  if (action === 'assigned') return <PersonAddIcon {...iconProps} color="success" />;
  if (action === 'unassigned') return <PersonRemoveIcon {...iconProps} color="warning" />;
  if (action === 'joined') return <GroupIcon {...iconProps} color="success" />;
  
  return <EditIcon {...iconProps} />;
};

// Get color for action type
const getActionColor = (action) => {
  const colors = {
    created: 'success',
    updated: 'info',
    deleted: 'error',
    moved: 'warning',
    commented: 'primary',
    attached: 'secondary',
    assigned: 'success',
    unassigned: 'warning',
    joined: 'success'
  };
  return colors[action] || 'default';
};

export default function ActivityFeed({ boardId, cardId = null, showFilters = true, maxHeight = 600 }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // Filter state
  const [filter, setFilter] = useState({
    userId: '',
    entityType: '',
    action: '',
    skip: 0,
    take: 50
  });

  // Load activities
  const loadActivities = async () => {
    setLoading(true);
    try {
      let data;
      if (cardId) {
        data = await apiService.getCardActivities(boardId, cardId, filter.skip, filter.take);
      } else {
        data = await apiService.getBoardActivities(boardId, filter);
      }
      setActivities(data || []);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (boardId) {
      loadActivities();
    }
  }, [boardId, cardId, filter]);

  const handleFilterChange = (field, value) => {
    setFilter(prev => ({ ...prev, [field]: value, skip: 0 }));
  };

  const clearFilters = () => {
    setFilter({
      userId: '',
      entityType: '',
      action: '',
      skip: 0,
      take: 50
    });
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            {cardId ? 'Card Activity' : 'Activity Feed'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size="small" onClick={loadActivities} disabled={loading}>
              <RefreshIcon />
            </IconButton>
            {showFilters && !cardId && (
              <IconButton 
                size="small" 
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                color={showFilterPanel ? 'primary' : 'default'}
              >
                <FilterIcon />
              </IconButton>
            )}
          </Box>
        </Box>

        {showFilters && !cardId && (
          <Collapse in={showFilterPanel}>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Entity Type</InputLabel>
                  <Select
                    value={filter.entityType}
                    label="Entity Type"
                    onChange={(e) => handleFilterChange('entityType', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="card">Cards</MenuItem>
                    <MenuItem value="column">Columns</MenuItem>
                    <MenuItem value="comment">Comments</MenuItem>
                    <MenuItem value="attachment">Attachments</MenuItem>
                    <MenuItem value="member">Members</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Action</InputLabel>
                  <Select
                    value={filter.action}
                    label="Action"
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="created">Created</MenuItem>
                    <MenuItem value="updated">Updated</MenuItem>
                    <MenuItem value="deleted">Deleted</MenuItem>
                    <MenuItem value="moved">Moved</MenuItem>
                    <MenuItem value="commented">Commented</MenuItem>
                    <MenuItem value="attached">Attached</MenuItem>
                  </Select>
                </FormControl>

                <Button size="small" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </Box>
            </Box>
          </Collapse>
        )}
      </Box>

      {/* Activity List */}
      <Box sx={{ flex: 1, overflow: 'auto', maxHeight }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : activities.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No activities yet
            </Typography>
          </Box>
        ) : (
          <List>
            {activities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar src={activity.user?.avatar} sx={{ width: 32, height: 32 }}>
                      {activity.user?.userName?.[0]?.toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        {getActivityIcon(activity.action, activity.entityType)}
                        <Typography variant="subtitle2">
                          {activity.user?.userName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {activity.description}
                        </Typography>
                        <Chip 
                          label={activity.action} 
                          size="small" 
                          color={getActionColor(activity.action)}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </Typography>
                        
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <Box sx={{ mt: 0.5 }}>
                            {activity.metadata.fromColumnTitle && activity.metadata.toColumnTitle && (
                              <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                                {activity.metadata.fromColumnTitle} → {activity.metadata.toColumnTitle}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < activities.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {activities.length >= filter.take && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
          <Button 
            size="small" 
            onClick={() => handleFilterChange('skip', filter.skip + filter.take)}
            disabled={loading}
          >
            Load More
          </Button>
        </Box>
      )}
    </Paper>
  );
}