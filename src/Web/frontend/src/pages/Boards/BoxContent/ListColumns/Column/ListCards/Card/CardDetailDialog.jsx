import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import AttachmentIcon from '@mui/icons-material/Attachment';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Avatar,
  Box,
  Button,
  CardMedia,
  Dialog,
  DialogContent,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert
} from "@mui/material";
import { useEffect, useMemo, useState, useCallback } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { toast } from 'react-toastify';
import { shallow } from 'zustand/shallow';
import UnsplashMenu from '~/components/UnsplashMenu/UnsplashMenu';
import { apiService } from '~/services/api';
import { useBoardStore } from '~/stores/boardStore';
import { CommentSection, AttachmentSection } from './CommentAttachmentSections';

const CardDetailDialog = ({ open, onClose, card: initialCard, onSaveDescription }) => {
  // ========================================
  // CRITICAL FIX: Always get fresh card from store
  // ========================================
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

  // Use store card if available, fallback to initial
  const currentCard = storeCard ?? initialCard;

  // ========================================
  // Store functions
  // ========================================
  const storeAssign = useBoardStore((s) => s.assignCardMember);
  const storeUnassign = useBoardStore((s) => s.unassignCardMember);
  const boardMembers = useBoardStore((s) => s.board?.members ?? [], shallow);
  const updateCard = useBoardStore((s) => s.updateCard);
  const columns = useBoardStore((s) => s.board?.columns ?? []);
  const moveCard = useBoardStore((s) => s.moveCard);

  // ========================================
  // Local state
  // ========================================
  const [editTitleMode, setEditTitleMode] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState('');
  const [moving, setMoving] = useState(false);
  // Comments
  // Comments handled by CommentSection component

  // Member UI
  const [memberMenuAnchor, setMemberMenuAnchor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Cover menu
  const [unsplashAnchor, setUnsplashAnchor] = useState(null);
  // Move menu anchor (context menu)
  const [moveMenuAnchor, setMoveMenuAnchor] = useState(null);

  // ========================================
  // Detect if card moved to different column
  // ========================================
  const cardMovedWarning = useMemo(() => {
    if (!initialCard || !currentCard) return null;
    if (initialCard.columnId !== currentCard.columnId) {
      return 'Card đã được di chuyển sang column khác. Dialog sẽ đóng khi bạn lưu.';
    }
    return null;
  }, [initialCard, currentCard]);

  // ========================================
  // Auto-close if card deleted from store
  // ========================================
  useEffect(() => {
    if (open && initialCard?.id && !storeCard) {
      console.warn('Card không còn tồn tại trong store, đóng dialog');
      toast.info('Card đã bị xóa');
      onClose();
    }
  }, [open, initialCard?.id, storeCard, onClose]);

  // ========================================
  // Sync local state with store card
  // ========================================
  useEffect(() => {
    if (!currentCard) return;

    setTempTitle(currentCard.title ?? '');
    setDescription(currentCard.description ?? '');
    setEditTitleMode(false);
    setEditing(false);
  }, [currentCard]);

  // ========================================
  // ReactQuill config
  // ========================================
  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean']
    ]
  }), []);

  // ========================================
  // Save handlers
  // ========================================
  const handleSaveTitle = async () => {
    if (!tempTitle.trim()) {
      toast.error('Tiêu đề không được để trống');
      return;
    }

    if (!currentCard) return;

    try {
      await updateCard(currentCard.columnId, currentCard.id, {
        ...currentCard,
        title: tempTitle
      });
      setEditTitleMode(false);
      toast.success('Đã cập nhật tiêu đề');

      // Close if card moved
      if (cardMovedWarning) {
        setTimeout(onClose, 500);
      }
    } catch (err) {
      console.error('handleSaveTitle error:', err);
      toast.error('Không thể cập nhật tiêu đề');
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
      toast.success('Đã cập nhật mô tả');

      // Close if card moved
      if (cardMovedWarning) {
        setTimeout(onClose, 500);
      }
    } catch (err) {
      console.error('handleSaveDescription error:', err);
      toast.error('Không thể cập nhật mô tả');
    }
  };

  // ========================================
  // Cover handlers
  // ========================================
  const openAddCoverMenu = (e) => {
    setUnsplashAnchor(e.currentTarget);
  };

  const closeUnsplashMenu = () => {
    setUnsplashAnchor(null);
  };

  const handleSelectUnsplashImage = async (image) => {
    const url = image?.full ?? image?.thumb;
    if (!currentCard || !url) return;

    try {
      const success = await updateCard(currentCard.columnId, currentCard.id, {
        ...currentCard,
        cover: url
      });

      if (success) {
        toast.success('Đã cập nhật cover từ Unsplash');
      } else {
        toast.error('Không thể cập nhật cover');
      }
    } catch (err) {
      console.error('handleSelectUnsplashImage error:', err);
      toast.error('Không thể cập nhật cover');
    } finally {
      closeUnsplashMenu();
    }
  };

  const handleDeleteCover = async () => {
    if (!currentCard) return;

    try {
      const success = await updateCard(currentCard.columnId, currentCard.id, {
        ...currentCard,
        cover: null
      });

      if (success) {
        toast.success('Đã xoá cover');
      } else {
        toast.error('Không thể xoá cover');
      }
    } catch (err) {
      console.error('handleDeleteCover error:', err);
      toast.error('Không thể xoá cover');
    }
  };

  // ========================================
  // Member helpers
  // ========================================
  const getUserIdFrom = (item) =>
    item?.user?.id ?? item?.userId ?? item?.id ?? null;

  const getUserEmailFrom = (item) =>
    item?.user?.email ?? item?.email ?? item?.userEmail ?? null;

  const getDisplayNameFrom = (item) =>
    item?.user?.userName ??
    item?.user?.fullName ??
    item?.fullName ??
    item?.userName ??
    item?.name ??
    'Unknown';

  const getAvatarFrom = (item) =>
    item?.user?.avatar ??
    item?.avatar ??
    item?.avatarUrl ??
    item?.user?.avatarUrl ??
    null;

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
      toast.info('Người này đã có trong card');
      return;
    }

    if (typeof storeAssign === 'function') {
      try {
        await storeAssign(currentCard.columnId, currentCard.id, email);
      } catch (err) {
        console.error('assign error:', err);
        toast.error('Gán thành viên thất bại');
      }
    }
  };

  const unassignHandler = async (member) => {
    if (!currentCard) return;

    const memberId = member?.id ?? getUserIdFrom(member);
    if (!memberId) return;

    if (typeof storeUnassign === 'function') {
      try {
        await storeUnassign(currentCard.columnId, currentCard.id, memberId);
      } catch (err) {
        console.error('unassign error:', err);
        toast.error('Gỡ thành viên thất bại');
      }
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

  // ========================================
  // Search members
  // ========================================
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
          const role = (m?.role || '').toLowerCase();
          return name.includes(q) || email.includes(q) || role.includes(q);
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

  // ========================================
  // Render
  // ========================================
  if (!currentCard) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { height: '75vh' } }}
      data-no-dnd='true'
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          {editTitleMode ? (
            <TextField
              sx={{
                p: 1,
                fontWeight: 'bold',
                cursor: 'pointer',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                flex: 1
              }}
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
                input: { sx: { fontWeight: 'bold', padding: 0 } }
              }}
            />
          ) : (
            <Typography
              sx={{
                p: 1,
                fontWeight: 'bold',
                cursor: 'pointer',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                flex: 1
              }}
              variant='h6'
              onClick={() => setEditTitleMode(true)}
              title="Click để chỉnh sửa tiêu đề"
            >
              {currentCard.title}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* Move column fallback (Button + Menu context menu) */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {/* Button that opens a Menu listing columns */}
            <Button
              size="small"
              variant="outlined"
              onClick={(e) => setMoveMenuAnchor(e.currentTarget)}
              disabled={moving}
            >
              Move to column
            </Button>

            <Menu
              anchorEl={moveMenuAnchor}
              open={Boolean(moveMenuAnchor)}
              onClose={() => setMoveMenuAnchor(null)}
              PaperProps={{ sx: { minWidth: 240 } }}
            >
              {columns.map(col => (
                <MenuItem
                  key={col.id}
                  onClick={async () => {
                    const toColumnId = col.id;
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
                  }}
                >
                  {col.title || col.name || col.id}
                </MenuItem>
              ))}
            </Menu>

            {moving && <CircularProgress size={20} />}
          </Box>

          <Button
            startIcon={<AddPhotoAlternateIcon />}
            variant="outlined"
            size="small"
            onClick={openAddCoverMenu}
          >
            Thêm cover
          </Button>

          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <UnsplashMenu
          anchorEl={unsplashAnchor}
          onClose={closeUnsplashMenu}
          onSelect={handleSelectUnsplashImage}
          apiService={apiService}
          width={520}
          maxHeight={520}
        />
      </Box>

      <DialogContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Warning if card moved */}
        {cardMovedWarning && (
          <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ m: 1 }}>
            {cardMovedWarning}
          </Alert>
        )}

        {/* Cover section */}
        <Box
          sx={{
            flex: '0 0 20%',
            position: 'relative',
            '&:hover .cover-overlay': { opacity: 1 }
          }}
        >
          {currentCard.cover ? (
            <>
              <CardMedia
                component="img"
                src={currentCard.cover}
                alt="cover"
                sx={{ height: '200px', width: '100%', objectFit: 'cover' }}
              />
              <Box
                className="cover-overlay"
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  opacity: 0,
                  transition: 'opacity 0.18s',
                }}
              >
                <IconButton
                  size="small"
                  onClick={handleDeleteCover}
                  sx={{ bgcolor: 'rgba(255,255,255,0.7)' }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </>
          ) : (
            <Box sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Typography color="text.secondary">No cover</Typography>
            </Box>
          )}
        </Box>

        {/* Content section */}
        <Box sx={{ flex: '1 1 80%', p: 2, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Actions */}

          {/* Attachments Section (centralized) */}
          <AttachmentSection card={currentCard} />

          {/* Comments Section */}
          <CommentSection card={currentCard} />

          {/* Members */}
          <Paper sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1">Thành viên</Typography>
              <Button size="small" onClick={handleOpenMemberMenu}>Thêm</Button>
            </Box>
            <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
              {currentCard.members?.length ? (
                currentCard.members.map(m => {
                  const displayName = getDisplayNameFrom(m);
                  const uid = getUserIdFrom(m);
                  return (
                    <Avatar
                      key={uid ?? m.id ?? Math.random().toString(36).slice(2)}
                      alt={displayName}
                      sx={{ width: 32, height: 32, cursor: 'pointer' }}
                      onClick={() => {
                        if (window.confirm(`Gỡ ${displayName} khỏi card?`)) {
                          unassignHandler(m);
                        }
                      }}
                    >
                      {displayName?.[0]?.toUpperCase() ?? '?'}
                    </Avatar>
                  );
                })
              ) : (
                <Typography color="text.secondary">Chưa có thành viên</Typography>
              )}
            </Box>
          </Paper>

          {/* Member menu */}
          <Menu
            anchorEl={memberMenuAnchor}
            open={Boolean(memberMenuAnchor)}
            onClose={handleCloseMemberMenu}
            PaperProps={{ sx: { width: 320, maxHeight: 300, p: 1, overflow: 'hidden' } }}
          >
            <Box sx={{ p: 1 }}>
              <input
                type="text"
                placeholder="Tìm kiếm thành viên"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  outline: 'none'
                }}
              />
            </Box>

            <Box sx={{ maxHeight: 220, overflowY: 'auto' }}>
              {loadingMembers ? (
                <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                  Đang tải...
                </Typography>
              ) : searchResults.length === 0 ? (
                <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                  Không có kết quả
                </Typography>
              ) : (
                searchResults.map((item) => {
                  const uid = getUserIdFrom(item);
                  const displayName = getDisplayNameFrom(item);
                  const avatar = getAvatarFrom(item);
                  return (
                    <MenuItem
                      key={uid ?? Math.random().toString(36).slice(2)}
                      onClick={async () => {
                        await assignHandler(item);
                        handleCloseMemberMenu();
                      }}
                      sx={{ gap: 1 }}
                    >
                      <Avatar src={avatar} sx={{ width: 28, height: 28, mr: 1 }}>
                        {displayName?.[0]?.toUpperCase() ?? '?'}
                      </Avatar>
                      <Typography noWrap>{displayName}</Typography>
                    </MenuItem>
                  );
                })
              )}
            </Box>
          </Menu>

          {/* Description */}
          <Paper sx={{ p: 1, flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1">Mô tả</Typography>
              {!editing && (
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => setEditing(true)}
                >
                  {description ? 'Chỉnh sửa' : 'Thêm'}
                </Button>
              )}
            </Box>

            <Box sx={{ mt: 1, flex: '1 1 auto', overflow: 'auto' }}>
              {editing ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{ flex: '1 1 auto' }}>
                    <ReactQuill
                      theme="snow"
                      value={description}
                      onChange={setDescription}
                      modules={modules}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
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
                <Box sx={{ minHeight: 120 }}>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: description || '<i style="color:#999">Không có mô tả</i>'
                    }}
                  />
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CardDetailDialog;