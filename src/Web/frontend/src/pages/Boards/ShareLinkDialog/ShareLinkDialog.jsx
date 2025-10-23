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
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

export default function ShareLinkDialog({ open, onClose, board }) {
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [allowShareLink, setAllowShareLink] = useState(true);

  useEffect(() => {
    if (open && board) {
      // Generate share link from board ID
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/boards/${board.id}`;
      setShareLink(link);
      setAllowShareLink(board.allowShareLink !== false);
    }
  }, [open, board]);

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

  const handleRefresh = () => {
    // In a real app, you might want to regenerate a secure token
    // For now, just show a toast
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
        {!allowShareLink ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Link sharing is disabled for this board. Enable it in board settings to share.
          </Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Anyone with this link can view the board {board.type === 'public' ? '(public board)' : '(private board - requires membership)'}.
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
              <Tooltip title="Refresh link">
                <IconButton onClick={handleRefresh}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Board access:</strong>
                {board.type === 'public' 
                  ? ' Anyone with the link can view this board.'
                  : ' Only board members can access this board.'}
              </Typography>
            </Alert>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {allowShareLink && (
          <Button variant="contained" onClick={handleCopy}>
            Copy Link
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}