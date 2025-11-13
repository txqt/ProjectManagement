import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ArchiveIcon from '@mui/icons-material/Archive';
import AttachmentIcon from '@mui/icons-material/Attachment';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CloseIcon from '@mui/icons-material/Close';
import CommentIcon from '@mui/icons-material/Comment';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import EditIcon from '@mui/icons-material/Edit';
import GroupIcon from '@mui/icons-material/Group';
import HistoryIcon from '@mui/icons-material/History';
import LabelIcon from '@mui/icons-material/Label';
import SubjectIcon from '@mui/icons-material/Subject';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CardMedia,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { toast } from 'react-toastify';
import { shallow } from 'zustand/shallow';
import ActivityFeed from '~/components/ActivityFeed/ActivityFeed';
import UnsplashMenu from '~/components/UnsplashMenu/UnsplashMenu';
import { apiService } from '~/services/api';
import { useBoardStore } from '~/stores/boardStore';
import { AttachmentSection, CommentSection } from './CommentAttachmentSections';

// Sidebar Action Button Component
const SidebarButton = ({ icon, label, onClick, disabled = false }) => (
  <Button
    fullWidth
    startIcon={icon}
    onClick={onClick}
    disabled={disabled}
    sx={{
      justifyContent: 'flex-start',
      py: 1,
      px: 2,
      color: 'text.secondary',
      bgcolor: 'action.hover',
      '&:hover': {
        bgcolor: 'action.selected'
      }
    }}
  >
    {label}
  </Button>
);

const CardDetailDialog = ({ open, onClose, card: initialCard, onSaveDescription }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // Store & SignalR
  const storeCard = useBoardStore(
    useCallback(
      (s) => {
        if (!initialCard?.id) return null;
        const cols = s.board?.columns ?? [];
        for (const col of cols) {
          const found = col.cards?.find(c => c.id === initialCard.id);
          if (found) return found;
        }
        return null;
      },
      [initialCard?.id]
    )
  );

  const currentCard = storeCard ?? initialCard;

  // Store functions
  const storeAssign = useBoardStore((s) => s.assignCardMember);
  const storeUnassign = useBoardStore((s) => s.unassignCardMember);
  const boardMembers = useBoardStore((s) => s.board?.members ?? [], shallow);
  const updateCard = useBoardStore((s) => s.updateCard);
  const columns = useBoardStore((s) => s.board?.columns ?? []);
  const moveCard = useBoardStore((s) => s.moveCard);

  // Local state
  const [editTitleMode, setEditTitleMode] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState('');
  const [moving, setMoving] = useState(false);

  // Member UI
  const [memberMenuAnchor, setMemberMenuAnchor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Cover & Move menu
  const [unsplashAnchor, setUnsplashAnchor] = useState(null);
  const [moveMenuAnchor, setMoveMenuAnchor] = useState(null);
  const [actionsMenuAnchor, setActionsMenuAnchor] = useState(null);

  const [activityDialogOpen, setActivityDialogOpen] = useState(false);

  const openActivityDialog = () => setActivityDialogOpen(true);
  const closeActivityDialog = () => setActivityDialogOpen(false);

  // Card moved warning
  const cardMovedWarning = useMemo(() => {
    if (!initialCard || !currentCard) return null;
    if (initialCard.columnId !== currentCard.columnId) {
      return 'Card has been moved to another column. Dialog will close when you save.';
    }
    return null;
  }, [initialCard, currentCard]);

  // Auto-close if card deleted
  useEffect(() => {
    if (open && initialCard?.id && !storeCard) {
      toast.info('Card has been deleted');
      onClose();
    }
  }, [open, initialCard?.id, storeCard, onClose]);

  // Sync local state with store card
  useEffect(() => {
    if (!currentCard) return;
    setTempTitle(currentCard.title ?? '');
    setDescription(currentCard.description ?? '');
    setEditTitleMode(false);
    setEditing(false);
  }, [currentCard]);

  // ReactQuill config
  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean']
    ]
  }), []);

  // Save handlers
  const handleSaveTitle = async () => {
    if (!tempTitle.trim()) {
      toast.error('Title cannot be empty');
      return;
    }

    if (!currentCard) return;

    try {
      await updateCard(currentCard.columnId, currentCard.id, {
        ...currentCard,
        title: tempTitle
      });
      setEditTitleMode(false);
      toast.success('Title updated');

      if (cardMovedWarning) {
        setTimeout(onClose, 500);
      }
    } catch (err) {
      console.error('handleSaveTitle error:', err);
      toast.error('Failed to update title');
    }
  };

  const handleSaveDescription = async () => {
    if (!currentCard) return;

    try {
      if (typeof onSaveDescription === 'function') {
        onSaveDescription(currentCard, description);
      }

      if (typeof updateCard === 'function') {
        await updateCard(currentCard.columnId, currentCard.id, {
          ...currentCard,
          description
        });
      }

      setEditing(false);
      toast.success('Description updated');

      if (cardMovedWarning) {
        setTimeout(onClose, 500);
      }
    } catch (err) {
      console.error('handleSaveDescription error:', err);
      toast.error('Failed to update description');
    }
  };

  // Cover handlers
  const openAddCoverMenu = (e) => setUnsplashAnchor(e.currentTarget);
  const closeUnsplashMenu = () => setUnsplashAnchor(null);

  const handleSelectUnsplashImage = async (image) => {
    const url = image?.full ?? image?.thumb;
    if (!currentCard || !url) return;

    try {
      await updateCard(currentCard.columnId, currentCard.id, {
        ...currentCard,
        cover: url
      });
      toast.success('Cover updated');
    } catch (err) {
      console.error('handleSelectUnsplashImage error:', err);
      toast.error('Failed to update cover');
    } finally {
      closeUnsplashMenu();
    }
  };

  const handleDeleteCover = async () => {
    if (!currentCard) return;
    try {
      await updateCard(currentCard.columnId, currentCard.id, {
        ...currentCard,
        cover: null
      });
      toast.success('Cover removed');
    } catch (err) {
      console.error('handleDeleteCover error:', err);
      toast.error('Failed to remove cover');
    }
  };

  // Member helpers
  const getUserIdFrom = (item) => item?.user?.id ?? item?.userId ?? item?.id ?? null;
  const getUserEmailFrom = (item) => item?.user?.email ?? item?.email ?? item?.userEmail ?? null;
  const getDisplayNameFrom = (item) => item?.user?.userName ?? item?.userName ?? item?.name ?? 'Unknown';
  const getAvatarFrom = (item) => item?.user?.avatar ?? item?.avatar ?? null;

  const isUserAssignedToCard = (cardObj, userIdOrEmail) => {
    if (!cardObj?.members) return false;
    return cardObj.members.some(m => {
      const mid = getUserIdFrom(m);
      const memEmail = getUserEmailFrom(m);
      return (mid && mid === userIdOrEmail) || (memEmail && memEmail === userIdOrEmail);
    });
  };

  const assignHandler = async (selectedItem) => {
    if (!currentCard) return;
    const email = getUserEmailFrom(selectedItem);
    const userId = getUserIdFrom(selectedItem);

    if (isUserAssignedToCard(currentCard, email ?? userId)) {
      toast.info('User already assigned');
      return;
    }

    try {
      await storeAssign(currentCard.columnId, currentCard.id, email);
    } catch (err) {
      console.error('assign error:', err);
      toast.error('Failed to assign member');
    }
  };

  const unassignHandler = async (member) => {
    if (!currentCard) return;
    const memberId = member?.id ?? getUserIdFrom(member);
    if (!memberId) return;

    try {
      await storeUnassign(currentCard.columnId, currentCard.id, memberId);
    } catch (err) {
      console.error('unassign error:', err);
      toast.error('Failed to remove member');
    }
  };

  const handleOpenMemberMenu = (e) => {
    setMemberMenuAnchor(e.currentTarget);
    setSearchQuery('');
    setSearchResults(boardMembers.slice(0, 5));
  };

  const handleCloseMemberMenu = () => {
    setMemberMenuAnchor(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Search members
  useEffect(() => {
    if (!memberMenuAnchor) return;

    let mounted = true;
    const q = (searchQuery || '').trim().toLowerCase();

    const timer = setTimeout(async () => {
      if (!mounted) return;
      setLoadingMembers(true);

      try {
        if (!q) {
          if (mounted) setSearchResults(boardMembers.slice(0, 5));
          return;
        }

        const localMatches = boardMembers.filter(m => {
          const name = (getDisplayNameFrom(m) || '').toLowerCase();
          const email = (getUserEmailFrom(m) || '').toLowerCase();
          return name.includes(q) || email.includes(q);
        });

        const results = [...localMatches];

        if (results.length < 5) {
          try {
            const apiRes = await apiService.searchUsers(q, 1, 5);
            const remote = (apiRes?.items ?? []).filter(u => {
              const uid = getUserIdFrom(u);
              const email = getUserEmailFrom(u);
              return !boardMembers.some(bm =>
                getUserIdFrom(bm) === uid || getUserEmailFrom(bm) === email
              );
            });

            for (let i = 0; i < remote.length && results.length < 5; i++) {
              results.push(remote[i]);
            }
          } catch (err) {
            console.error('searchUsers error:', err);
          }
        }

        if (mounted) setSearchResults(results.slice(0, 5));
      } finally {
        if (mounted) setLoadingMembers(false);
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
      setLoadingMembers(false);
    };
  }, [searchQuery, boardMembers, memberMenuAnchor]);

  // Move card handler
  const handleMoveCard = async (toColumnId) => {
    setMoveMenuAnchor(null);
    if (!toColumnId || toColumnId === currentCard.columnId) return;

    setMoving(true);
    try {
      const dest = columns.find(c => c.id === toColumnId);
      const newIndex = (dest?.cards?.length) ?? 0;
      await moveCard(currentCard.columnId, toColumnId, currentCard.id, newIndex);
      toast.success('Card moved');
      if (cardMovedWarning) setTimeout(onClose, 500);
    } catch (err) {
      console.error('moveCard error:', err);
      toast.error('Failed to move card');
    } finally {
      setMoving(false);
    }
  };

  if (!currentCard) return null;

  // Render sidebar (desktop only)
  const renderSidebar = () => (
    <Box sx={{ width: 200, flexShrink: 0, overflowY: 'auto', borderLeft: 1, borderColor: 'divider', p: 2 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ px: 2, py: 1, display: 'block' }}>
        ADD TO CARD
      </Typography>

      <Stack spacing={1} sx={{ px: 1 }}>
        <SidebarButton
          icon={<GroupIcon fontSize="small" />}
          label="Members"
          onClick={handleOpenMemberMenu}
        />

        <SidebarButton
          icon={<LabelIcon fontSize="small" />}
          label="Labels"
          onClick={() => toast.info('Labels feature coming soon')}
        />

        <SidebarButton
          icon={<CheckBoxIcon fontSize="small" />}
          label="Checklist"
          onClick={() => toast.info('Checklist feature coming soon')}
        />

        <SidebarButton
          icon={<AddPhotoAlternateIcon fontSize="small" />}
          label="Cover"
          onClick={openAddCoverMenu}
        />

      </Stack>

      <Divider sx={{ my: 2 }} />

      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ px: 2, py: 1, display: 'block' }}>
        ACTIONS
      </Typography>

      <Stack spacing={1} sx={{ px: 1 }}>
        <SidebarButton
          icon={<DriveFileMoveIcon fontSize="small" />}
          label="Move"
          onClick={(e) => setMoveMenuAnchor(e.currentTarget)}
          disabled={moving}
        />

        <SidebarButton
          icon={<ContentCopyIcon fontSize="small" />}
          label="Copy"
          onClick={() => toast.info('Copy feature coming soon')}
        />

        <SidebarButton
          icon={<ArchiveIcon fontSize="small" />}
          label="Archive"
          onClick={() => toast.info('Archive feature coming soon')}
        />
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Stack spacing={1} sx={{ px: 1 }}>
        <SidebarButton

          icon={<HistoryIcon fontSize="small" />}
          label="Activity Logs"
          onClick={openActivityDialog}
        />
      </Stack>
    </Box>
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="lg"
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            height: isMobile ? '100%' : '90vh',
            maxHeight: isMobile ? '100%' : '90vh'
          }
        }}
        data-no-dnd='true'
      >
        {/* Header */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <SubjectIcon sx={{ mr: 1, color: 'text.secondary' }} />
            {editTitleMode ? (
              <TextField
                autoFocus
                fullWidth
                size="medium"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setEditTitleMode(false);
                }}
                onBlur={() => setEditTitleMode(false)}
                variant="standard"
                slotProps={{
                  input: { sx: { fontSize: '1.25rem', fontWeight: 600 } }
                }}
              />
            ) : (
              <Typography
                variant="h6"
                onClick={() => setEditTitleMode(true)}
                sx={{
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  '&:hover': { bgcolor: 'action.hover' },
                  px: 1,
                  py: 0.5,
                  borderRadius: 1
                }}
              >
                {currentCard.title}
              </Typography>
            )}
          </Box>

          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 0, display: 'flex', overflow: 'hidden' }}>
          {/* Main Content Area */}
          <Box sx={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Warning if card moved */}
            {cardMovedWarning && (
              <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ m: 2 }}>
                {cardMovedWarning}
              </Alert>
            )}
            {/* Cover Image */}
            {currentCard.cover && (
              <Box
                sx={{
                  position: 'relative',
                  height: 200,
                  '&:hover .cover-actions': { opacity: 1 }
                }}
              >
                <CardMedia
                  component="img"
                  src={currentCard.cover}
                  alt="cover"
                  sx={{
                    height: '100%',
                    width: '100%',
                    objectFit: 'cover'
                  }}
                />
                <Box
                  className="cover-actions"
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    display: 'flex',
                    gap: 1,
                    opacity: 0,
                    transition: 'opacity 0.2s'
                  }}
                >
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={openAddCoverMenu}
                  >
                    Change
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteCover}
                  >
                    Remove
                  </Button>
                </Box>
              </Box>
            )}

            {/* Content Container */}
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Left: Main Content */}
              <Box sx={{
                flex: 1,
                p: 3,
                overflow: 'auto',
                minWidth: 0
              }}>
                {/* Column Info */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    in list{' '}
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        '&:hover': { color: 'primary.main' }
                      }}
                    >
                      {columns.find(c => c.id === currentCard.columnId)?.title}
                    </Typography>
                  </Typography>
                </Box>

                {/* Members Section */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <GroupIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Members
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    {currentCard.members?.map(m => {
                      const displayName = getDisplayNameFrom(m);
                      const uid = getUserIdFrom(m);
                      return (
                        <Tooltip key={uid} title={`${displayName} - Click to remove`}>
                          <Avatar
                            src={getAvatarFrom(m)}
                            sx={{
                              width: 32,
                              height: 32,
                              cursor: 'pointer',
                              '&:hover': { opacity: 0.7 }
                            }}
                            onClick={() => {
                              if (window.confirm(`Remove ${displayName}?`)) {
                                unassignHandler(m);
                              }
                            }}
                          >
                            {displayName?.[0]?.toUpperCase() ?? '?'}
                          </Avatar>
                        </Tooltip>
                      );
                    })}

                    <IconButton
                      size="small"
                      onClick={handleOpenMemberMenu}
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: 'action.hover',
                        '&:hover': { bgcolor: 'action.selected' }
                      }}
                    >
                      <GroupIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {/* Description */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SubjectIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                      <Typography variant="subtitle2" fontWeight={600}>
                        Description
                      </Typography>
                    </Box>
                    {!editing && (
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => setEditing(true)}
                      >
                        {description ? 'Edit' : 'Add'}
                      </Button>
                    )}
                  </Box>

                  {editing ? (
                    <Box>
                      <ReactQuill
                        theme="snow"
                        value={description}
                        onChange={setDescription}
                        modules={modules}
                        style={{ minHeight: 120 }}
                      />
                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={handleSaveDescription}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setEditing(false);
                            setDescription(currentCard.description ?? '');
                          }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        minHeight: 60,
                        p: 2,
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.selected' }
                      }}
                      onClick={() => setEditing(true)}
                    >
                      {description ? (
                        <div dangerouslySetInnerHTML={{ __html: description }} />
                      ) : (
                        <Typography color="text.secondary">
                          Add a more detailed description...
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>

                {/* Attachments */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AttachmentIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Attachments
                    </Typography>
                  </Box>
                  <AttachmentSection card={currentCard} />
                </Box>

                {/* Comments */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CommentIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Activity
                    </Typography>
                  </Box>
                  <CommentSection card={currentCard} />
                </Box>

                {/* Activity Log */}
                <Dialog
                  open={activityDialogOpen}
                  onClose={closeActivityDialog}
                  fullWidth
                  maxWidth="sm"
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6">Activity Logs</Typography>
                    <IconButton onClick={closeActivityDialog}><CloseIcon /></IconButton>
                  </Box>
                  <DialogContent sx={{ maxHeight: '60vh', overflowY: 'auto', p: 2 }}>
                    <ActivityFeed boardId={currentCard.boardId} cardId={currentCard.id} />
                  </DialogContent>
                </Dialog>
              </Box>

              {/* Right: Sidebar (Desktop only) */}
              {!isMobile && !isTablet && renderSidebar()}
            </Box>
          </Box>
        </DialogContent>

        {/* Mobile Action Bar */}
        {isMobile && (
          <Box sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap'
          }}>
            <Button
              size="small"
              startIcon={<GroupIcon />}
              onClick={handleOpenMemberMenu}
              variant="outlined"
            >
              Members
            </Button>
            <Button
              size="small"
              startIcon={<AddPhotoAlternateIcon />}
              onClick={openAddCoverMenu}
              variant="outlined"
            >
              Cover
            </Button>
            <Button
              size="small"
              startIcon={<DriveFileMoveIcon />}
              onClick={(e) => setMoveMenuAnchor(e.currentTarget)}
              variant="outlined"
              disabled={moving}
            >
              Move
            </Button>
            <IconButton
              size="small"
              onClick={(e) => setActionsMenuAnchor(e.currentTarget)}
            >
              <EditIcon />
            </IconButton>
          </Box>
        )}
      </Dialog>

      {/* Member Menu */}
      <Menu
        anchorEl={memberMenuAnchor}
        open={Boolean(memberMenuAnchor)}
        onClose={handleCloseMemberMenu}
        PaperProps={{ sx: { width: 320, maxHeight: 400 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Add Member
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </Box>

        <Divider />

        <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
          {loadingMembers ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <CircularProgress size={20} />
            </Box>
          ) : searchResults.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No members found
              </Typography>
            </Box>
          ) : (
            searchResults.map((item) => {
              const uid = getUserIdFrom(item);
              const displayName = getDisplayNameFrom(item);
              const avatar = getAvatarFrom(item);
              const isAssigned = isUserAssignedToCard(currentCard, uid);

              return (
                <MenuItem
                  key={uid}
                  onClick={async () => {
                    if (!isAssigned) {
                      await assignHandler(item);
                    }
                    handleCloseMemberMenu();
                  }}
                  disabled={isAssigned}
                >
                  <Avatar src={avatar} sx={{ width: 32, height: 32, mr: 2 }}>
                    {displayName?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2">{displayName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getUserEmailFrom(item)}
                    </Typography>
                  </Box>
                  {isAssigned && (
                    <Chip label="Member" size="small" color="primary" />
                  )}
                </MenuItem>
              );
            })
          )}
        </Box>
      </Menu>

      {/* Move Menu */}
      <Menu
        anchorEl={moveMenuAnchor}
        open={Boolean(moveMenuAnchor)}
        onClose={() => setMoveMenuAnchor(null)}
        PaperProps={{ sx: { minWidth: 250 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2">Move Card</Typography>
        </Box>
        <Divider />
        {columns.map((col) => (
          <MenuItem
            key={col.id}
            onClick={() => handleMoveCard(col.id)}
            disabled={col.id === currentCard.columnId || moving}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Typography flex={1}>{col.title}</Typography>
              {col.id === currentCard.columnId && (
                <Chip label="Current" size="small" />
              )}
            </Box>
          </MenuItem>
        ))}
      </Menu>

      {/* Mobile Actions Menu */}
      <Menu
        anchorEl={actionsMenuAnchor}
        open={Boolean(actionsMenuAnchor)}
        onClose={() => setActionsMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          setActionsMenuAnchor(null);
          toast.info('Copy feature coming soon');
        }}>
          <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
          Copy
        </MenuItem>
        <MenuItem onClick={() => {
          setActionsMenuAnchor(null);
          toast.info('Archive feature coming soon');
        }}>
          <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
          Archive
        </MenuItem>
        <MenuItem onClick={() => openActivityDialog()}>
          <HistoryIcon fontSize="small" sx={{ mr: 1 }} />
          Activity Logs
        </MenuItem>
      </Menu>

      {/* Unsplash Menu */}
      <UnsplashMenu
        anchorEl={unsplashAnchor}
        onClose={closeUnsplashMenu}
        onSelect={handleSelectUnsplashImage}
        apiService={apiService}
        width={520}
        maxHeight={520}
      />
    </>
  );
};

export default CardDetailDialog;