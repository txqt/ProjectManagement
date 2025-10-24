import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Box,
  Typography,
  Alert,
  InputAdornment,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { apiService } from '~/services/api';

export default function ShareLinkDialog({ open, onClose, board }) {
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Generate token when dialog opens
  useEffect(() => {
    if (open && board?.id) {
      fetchOrGenerateToken();
    }
  }, [open, board?.id]);

  const fetchOrGenerateToken = async () => {
    setLoading(true);
    try {
      // Thử lấy token cũ
      const response = await apiService.getShareToken(board.id);
      setTokenData(response);
      setShareLink(response.shareUrl);
    } catch {
      // Nếu không có hoặc hết hạn thì tạo mới
      const response = await apiService.generateShareToken(board.id);
      setTokenData(response);
      setShareLink(response.shareUrl);
    } finally {
      setLoading(false);
    }
  };

  const generateShareToken = async () => {
    if (!board?.id) return;

    setLoading(true);
    try {
      const response = await apiService.generateShareToken(board.id);
      setTokenData(response);
      setShareLink(response.shareUrl);
    } catch (err) {
      console.error('Failed to generate share token:', err);
      toast.error('Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Link copied to clipboard!');

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy link');
    }
  };

  const handleRefresh = async () => {
    await generateShareToken();
    toast.info('Link refreshed');
  };

  if (!board) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Share Board</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {board.type === 'public'
                ? 'Anyone with this link can join the board as a member.'
                : 'Anyone with this link can request to join this private board.'}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                value={shareLink}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title={copied ? 'Copied!' : 'Copy link'}>
                        <IconButton onClick={handleCopy} edge="end">
                          {copied ? <CheckIcon color="success" /> : <CopyIcon />}
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  )
                }}
              />
              <Tooltip title="Generate new link (old link will be invalidated)">
                <IconButton onClick={handleRefresh} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>

            {tokenData && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Link expires:</strong> {new Date(tokenData.expiresAt).toLocaleDateString()}
                  <br />
                  <strong>Board type:</strong> {board.type === 'public' ? 'Public (auto-join)' : 'Private (requires approval)'}
                </Typography>
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={handleCopy} disabled={loading || !shareLink}>
          Copy Link
        </Button>
      </DialogActions>
    </Dialog>
  );
}