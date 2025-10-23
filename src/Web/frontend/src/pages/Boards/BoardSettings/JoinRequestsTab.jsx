import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab
} from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { apiService } from '~/services/api';
import { formatDistanceToNow } from 'date-fns';

export default function JoinRequestsTab({ board }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedRole, setSelectedRole] = useState({});

  useEffect(() => {
    if (board?.id) {
      loadRequests();
    }
  }, [board?.id, statusFilter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await apiService.getBoardJoinRequests(board.id, statusFilter);
      setRequests(data || []);
    } catch (err) {
      console.error('Failed to load join requests:', err);
      toast.error('Failed to load join requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId, response) => {
    const role = selectedRole[requestId] || 'member';
    
    setProcessing(requestId);
    try {
      const result = await apiService.respondToJoinRequest(
        board.id,
        requestId,
        response,
        role
      );

      if (result.success) {
        toast.success(result.message || `Request ${response}d successfully`);
        await loadRequests();
      } else {
        toast.error(result.message || 'Failed to process request');
      }
    } catch (err) {
      console.error('Failed to respond to request:', err);
      toast.error(err.message || 'Failed to process request');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2">
          Join Requests ({requests.length})
        </Typography>
        
        <Tabs
          value={statusFilter}
          onChange={(_, val) => setStatusFilter(val)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab value="pending" label="Pending" />
          <Tab value="approved" label="Approved" />
          <Tab value="rejected" label="Rejected" />
        </Tabs>
      </Box>

      {requests.length === 0 ? (
        <Alert severity="info">
          No {statusFilter} join requests
        </Alert>
      ) : (
        <List>
          {requests.map((request) => (
            <ListItem
              key={request.id}
              divider
              sx={{
                flexDirection: 'column',
                alignItems: 'flex-start',
                py: 2
              }}
            >
              <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', mb: 1 }}>
                <ListItemAvatar>
                  <Avatar src={request.user?.avatar}>
                    {request.user?.userName?.[0]?.toUpperCase() || '?'}
                  </Avatar>
                </ListItemAvatar>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2">
                        {request.user?.userName || 'Unknown'}
                      </Typography>
                      <Chip 
                        label={request.status} 
                        size="small" 
                        color={getStatusColor(request.status)}
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">
                        {request.user?.email || 'No email'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Requested {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                      </Typography>
                    </>
                  }
                />
              </Box>

              {request.message && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    ml: 7, 
                    p: 1, 
                    bgcolor: 'action.hover', 
                    borderRadius: 1,
                    fontStyle: 'italic',
                    width: '100%'
                  }}
                >
                  "{request.message}"
                </Typography>
              )}

              {request.status === 'pending' && (
                <Box sx={{ display: 'flex', gap: 1, ml: 7, mt: 1 }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={selectedRole[request.id] || 'member'}
                      label="Role"
                      onChange={(e) => 
                        setSelectedRole(prev => ({ 
                          ...prev, 
                          [request.id]: e.target.value 
                        }))
                      }
                    >
                      <MenuItem value="member">Member</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<CheckIcon />}
                    disabled={processing === request.id}
                    onClick={() => handleRespond(request.id, 'approve')}
                  >
                    {processing === request.id ? 'Processing...' : 'Approve'}
                  </Button>

                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<CloseIcon />}
                    disabled={processing === request.id}
                    onClick={() => handleRespond(request.id, 'reject')}
                  >
                    Reject
                  </Button>
                </Box>
              )}

              {request.status !== 'pending' && request.respondedAt && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 7, mt: 1 }}>
                  {request.status === 'approved' ? 'Approved' : 'Rejected'} by {request.responder?.userName || 'Admin'}{' '}
                  {formatDistanceToNow(new Date(request.respondedAt), { addSuffix: true })}
                </Typography>
              )}
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}