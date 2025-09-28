import React from 'react';
import { usePermissions } from '~/hooks/usePermissions';
import { Alert, CircularProgress, Box } from '@mui/material';
import { useParams } from 'react-router-dom';

const PermissionGuard = ({ 
  children, 
  permission, 
  boardId = null,   // optional
  fallback = null,
  showLoading = true,
  showError = true 
}) => {
  const { boardId: routeBoardId } = useParams();   // lấy từ URL nếu có
  const { hasSystemPermission, hasBoardPermission, loading } = usePermissions();

  const effectiveBoardId = boardId ?? routeBoardId; // ưu tiên prop, fallback sang route

  if (loading && showLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
        <CircularProgress size={20} />
      </Box>
    );
  }

  const hasPermission = effectiveBoardId 
    ? hasBoardPermission(effectiveBoardId, permission)
    : hasSystemPermission(permission);

  if (!hasPermission) {
    if (fallback) return fallback;

    if (showError) {
      return (
        <Alert severity="warning" sx={{ mt: 1 }}>
          You don't have permission to access this feature.
        </Alert>
      );
    }

    return null;
  }

  return children;
};

export default PermissionGuard;
