import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert
} from '@mui/material';
import PermissionGuard from '~/components/PermissionGuard/PermissionGuard';
import { usePermissions } from '~/hooks/usePermissions';
import { apiService } from '~/services/api';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [boards, setBoards] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isSystemAdmin } = usePermissions();

  useEffect(() => {
    if (isSystemAdmin()) {
      loadAdminData();
    }
  }, [isSystemAdmin]);

  const loadAdminData = async () => {
    try {
      const [usersResponse, boardsResponse, statsResponse] = await Promise.allSettled([
        apiService.getAllUsers(),
        apiService.getAllBoards(),
        apiService.getSystemStats()
      ]);

      if (usersResponse.status === 'fulfilled') {
        setUsers(usersResponse.value);
      }
      if (boardsResponse.status === 'fulfilled') {
        setBoards(boardsResponse.value);
      }
      if (statsResponse.status === 'fulfilled') {
        setStats(statsResponse.value);
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isSystemAdmin()) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Access denied. Admin privileges required.
      </Alert>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      <PermissionGuard permission="system.view_stats">
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total Users</Typography>
                <Typography variant="h4">{stats?.userCount || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total Boards</Typography>
                <Typography variant="h4">{boards.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Active Users</Typography>
                <Typography variant="h4">{users.filter(u => !u.lockoutEnd).length}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </PermissionGuard>

      <PermissionGuard permission="system.view_all_users">
        <Typography variant="h5" gutterBottom>
          Users Management
        </Typography>
        
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.userName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {user.lockoutEnd ? 'Banned' : 'Active'}
                  </TableCell>
                  <TableCell>
                    <PermissionGuard permission="system.manage_users" showError={false}>
                      <Button 
                        size="small" 
                        color={user.lockoutEnd ? "primary" : "error"}
                        onClick={() => {/* Handle ban/unban */}}
                      >
                        {user.lockoutEnd ? 'Unban' : 'Ban'}
                      </Button>
                    </PermissionGuard>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </PermissionGuard>

      <PermissionGuard permission="system.view_all_boards">
        <Typography variant="h5" gutterBottom>
          All Boards
        </Typography>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Members</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {boards.map((board) => (
                <TableRow key={board.id}>
                  <TableCell>{board.title}</TableCell>
                  <TableCell>{board.owner?.userName}</TableCell>
                  <TableCell>{board.type}</TableCell>
                  <TableCell>{new Date(board.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{board.members?.length || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </PermissionGuard>
    </Box>
  );
};

export default AdminDashboard;