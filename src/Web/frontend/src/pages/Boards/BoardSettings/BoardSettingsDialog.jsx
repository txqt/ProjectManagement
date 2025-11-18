import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  Divider,
  Alert,
  Switch,
  FormControlLabel,
  ListItemAvatar
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Save as SaveIcon,
  ContentCopy as ContentCopyIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { apiService } from '~/services/api';
import UnsplashMenu from '~/components/UnsplashMenu/UnsplashMenu';
import { useBoardStore } from '~/stores/boardStore';
import InviteDialog from '~/components/BoardInvites/InviteDialog';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BoardJoinRequestsTab from './BoardJoinRequestsTab';
import ActivityFeed from '~/components/ActivityFeed/ActivityFeed';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`board-settings-tabpanel-${index}`}
      aria-labelledby={`board-settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export default function BoardSettingsDialog({ open, onClose, onBoardUpdated, board: boardProp }) {
  // If boardProp is provided (when opening from outside), use it; otherwise fall back to store.
  const boardFromStore = useBoardStore(state => state.board);
  const board = boardProp || boardFromStore;

  const deleteBoard = useBoardStore(state => state.deleteBoard);
  const updateBoard = useBoardStore(state => state.updateBoard);
  const updateBoardMemberRole = useBoardStore(state => state.updateBoardMemberRole);
  const removeBoardMember = useBoardStore(state => state.removeBoardMember);
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const boardMembers = useBoardStore(state => state.board?.members ?? []);

  // General settings
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('private');
  const [cover, setCover] = useState('');

  // Members
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [newRole, setNewRole] = useState('');

  // Advanced settings
  const [allowCommentsOnCard, setallowCommentsOnCard] = useState(true);
  const [allowAttachmentsOnCard, setallowAttachmentsOnCard] = useState(true);

  // Unsplash menu
  const [unsplashAnchor, setUnsplashAnchor] = useState(null);

  // Danger zone
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [inviteOpen, setInviteOpen] = useState(false);

  const [allowShareInviteLink, setallowShareInviteLink] = useState(true);

  const makeTemplate = useBoardStore(state => state.makeTemplate);

  const convertToBoard = useBoardStore(state => state.convertToBoard);

  useEffect(() => {
    if (board && open) {
      setTitle(board.title || '');
      setDescription(board.description || '');
      setType(board.type || 'private');
      setCover(board.cover || '');
      setallowShareInviteLink(board.allowShareInviteLink !== false); // Default true
      setallowCommentsOnCard(board.allowCommentsOnCard ?? true);
      setallowAttachmentsOnCard(board.allowAttachmentsOnCard ?? true);
    }
  }, [board, open]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // General Settings Handlers
  const handleSaveGeneral = async () => {
    if (!title.trim()) {
      toast.error('Board  title is required');
      return;
    }

    setLoading(true);
    try {
      // If store action exists use it; otherwise fall back to API
      if (updateBoard) {
        const updatedBoard = await updateBoard(
          {
            title,
            description,
            type,
            cover
          });

        if (onBoardUpdated) onBoardUpdated(updatedBoard);
      } else if (board?.id) {
        const res = await apiService.updateBoard(board.id, { title, description, type, cover });
        if (res) {
          if (onBoardUpdated) onBoardUpdated(res);
        }
      }

      toast.success('Board settings updated successfully');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCover = (image) => {
    setCover(image?.full || image?.thumb || '');
    setUnsplashAnchor(null);
  };

  // Member Management Handlers
  const handleUpdateMemberRole = async (memberId, role) => {
    setLoading(true);
    try {
      if (updateBoardMemberRole) {
        await updateBoardMemberRole(memberId, role);
      } else if (board?.id) {
        await apiService.updateBoardMemberRole(board.id, memberId, { role });
      }

      setEditingMemberId(null);
      toast.success('Member role updated');
    }
    finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member from the board?')) return;

    setLoading(true);
    try {
      if (removeBoardMember) {
        await removeBoardMember(memberId);
      } else if (board?.id) {
        await apiService.removeBoardMember(board.id, memberId);
      }
      toast.success('Member removed');
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error('Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  // Advanced Settings Handlers
  const handleSaveAdvanced = async () => {
    setLoading(true);
    try {
      if (updateBoard) {
        const updatedBoard = await updateBoard({
          allowShareInviteLink,
          allowCommentsOnCard,
          allowAttachmentsOnCard
        });

        if (onBoardUpdated) onBoardUpdated(updatedBoard);
      } else if (board?.id) {
        const res = await apiService.updateBoard(board.id, { allowShareInviteLink, allowCommentsOnCard, allowAttachmentsOnCard });
        if (res && onBoardUpdated) onBoardUpdated(res);
      }

      toast.success('Advanced settings updated');
    } finally {
      setLoading(false);
    }
  }

  // Delete Board Handler
  const handleDeleteBoard = async () => {
    if (deleteConfirmText !== board.title) {
      toast.error('Board title does not match');
      return;
    }

    if (!window.confirm('Are you absolutely sure? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      if (deleteBoard) {
        await deleteBoard(board.id);
      } else if (board?.id) {
        await apiService.deleteBoard(board.id);
      }
      toast.success('Board deleted successfully');
      onClose();
      // Redirect to home page
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  // New: Clone board (moved from BoardListView menu)
  const handleCloneBoard = async () => {
    if (!board) return;
    if (!window.confirm('Clone this board? This will create a new board copy.')) return;

    setLoading(true);
    try {
      const cloneData = {
        title: `${board.title} (Clone)`,
        includeCards: true,
        includeLists: true,
      };

      const res = await apiService.cloneBoard(board.id, cloneData);
      if (res && res.id) {
        toast.success('Board cloned successfully');
        // Redirect to the cloned board
        window.location.href = `/boards/${res.id}`;
      } else {
        toast.error('Failed to clone board');
      }
    } catch (err) {
      console.error('Clone failed:', err);
      toast.error('Clone failed: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTemplateOrBoard = async () => {
    if (!board) return;

    setLoading(true);

    try {
      console.log('board.type', board.type)
      if (board.type === "template") {
        await convertToBoard();
      }
      else {
        await makeTemplate();
      }
      if (onBoardUpdated) onBoardUpdated(board);

    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { minHeight: '600px' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="span">Board Settings</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider />

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label="General" />
            <Tab label="Members" />
            <Tab label="Join Requests" />
            <Tab label="Advanced" />
            <Tab label="Activity" />
            <Tab label="Danger Zone" />
          </Tabs>
        </Box>

        <DialogContent>
          {/* General Tab */}
          <TabPanel value={currentTab} index={0}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Board Title"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {board?.type !== 'template' && (
                <FormControl fullWidth>
                  <InputLabel>Visibility</InputLabel>
                  <Select
                    value={type}
                    label="Visibility"
                    onChange={(e) => setType(e.target.value)}
                  >
                    <MenuItem value="private">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LockIcon fontSize="small" />
                        Private - Only invited members
                      </Box>
                    </MenuItem>
                    <MenuItem value="public">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PublicIcon fontSize="small" />
                        Public - Anyone with link
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>)}

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Board Cover
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 160,
                      height: 100,
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'grey.100'
                    }}
                  >
                    {cover ? (
                      <img
                        src={cover}
                        alt="Board cover"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'text.secondary'
                        }}
                      >
                        No cover
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(e) => setUnsplashAnchor(e.currentTarget)}
                    >
                      Choose from Unsplash
                    </Button>
                    {cover && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => setCover('')}
                      >
                        Remove Cover
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={handleCloneBoard}
                  disabled={loading}
                >
                  Clone Board
                </Button>

                {board?.type !== 'template' ? (
                  <Button
                    variant="outlined"
                    startIcon={<AutoAwesomeIcon />}
                    onClick={() => handleToggleTemplateOrBoard()}
                    disabled={loading}
                  >
                    Make template
                  </Button>
                ) : (<Button
                  variant="outlined"
                  startIcon={<AutoAwesomeIcon />}
                  onClick={() => handleToggleTemplateOrBoard()}
                  disabled={loading}
                >
                  Convert to board
                </Button>)}

                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveGeneral}
                  disabled={loading}
                >
                  Save Changes
                </Button>
              </Box>
            </Box>
          </TabPanel>

          {/* Members Tab */}
          <TabPanel value={currentTab} index={1}>
            <Box>
              <Box sx={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Board Members ({boardMembers.length})
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<PersonAddIcon />}
                  sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white' } }}
                  onClick={() => setInviteOpen(true)}
                >
                  Invite
                </Button>
              </Box>
              <List>
                {boardMembers.map((member) => (
                  <ListItem key={member.id} divider>
                    <ListItemAvatar>
                      <Avatar src={member.user?.avatar}>
                        {member.user?.userName?.[0]?.toUpperCase() || '?'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.user?.userName || 'Unknown'}
                      secondary={member.user?.email || ''}
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {editingMemberId === member.id ? (
                          <>
                            <Select
                              size="small"
                              value={newRole || member.role}
                              onChange={(e) => setNewRole(e.target.value)}
                              sx={{ minWidth: 100 }}
                            >
                              <MenuItem value="member">Member</MenuItem>
                              <MenuItem value="admin">Admin</MenuItem>
                            </Select>
                            <Button
                              size="small"
                              onClick={() => handleUpdateMemberRole(member.id, newRole)}
                              disabled={loading}
                            >
                              Save
                            </Button>
                            <Button
                              size="small"
                              onClick={() => setEditingMemberId(null)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Chip
                              label={member.role}
                              size="small"
                              color={member.role === 'admin' ? 'primary' : 'default'}
                            />
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingMemberId(member.id);
                                setNewRole(member.role);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            {member.role !== 'owner' && (
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveMember(member.id)}
                                disabled={loading}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </>
                        )}
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            <BoardJoinRequestsTab boardId={board?.id} />
          </TabPanel>

          <TabPanel value={currentTab} index={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2">Board Features</Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={allowShareInviteLink}
                    onChange={(e) => setallowShareInviteLink(e.target.checked)}
                  />
                }
                label="Allow share link (anyone with link can view based on board type)"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={allowCommentsOnCard}
                    onChange={(e) => setallowCommentsOnCard(e.target.checked)}
                  />
                }
                label="Allow comments on cards"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={allowAttachmentsOnCard}
                    onChange={(e) => setallowAttachmentsOnCard(e.target.checked)}
                  />
                }
                label="Allow file attachments on cards"
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveAdvanced}
                  disabled={loading}
                >
                  Save Changes
                </Button>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={currentTab} index={4}>
            <ActivityFeed
              boardId={board?.id}
              showFilters={true}
              maxHeight={400}
            />
          </TabPanel>

          {/* Danger Zone Tab */}
          <TabPanel value={currentTab} index={5}>
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Warning: Danger Zone
              </Typography>
              <Typography variant="body2">
                Once you delete a board, there is no going back. Please be certain.
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2">Delete This Board</Typography>

              <Typography variant="body2" color="text.secondary">
                Type the board title "<strong>{board?.title}</strong>" to confirm deletion:
              </Typography>

              <TextField
                fullWidth
                placeholder="Enter board title"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />

              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteBoard}
                disabled={loading || deleteConfirmText !== board?.title}
                fullWidth
              >
                Delete Board Permanently
              </Button>
            </Box>
          </TabPanel>
        </DialogContent>

        <Divider />

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} board={board} />

      {/* Unsplash Menu */}
      <UnsplashMenu
        anchorEl={unsplashAnchor}
        onClose={() => setUnsplashAnchor(null)}
        onSelect={handleSelectCover}
        apiService={apiService}
      />
    </>
  );
}