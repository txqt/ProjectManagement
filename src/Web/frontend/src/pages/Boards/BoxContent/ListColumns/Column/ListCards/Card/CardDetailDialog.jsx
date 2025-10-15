import React, { useEffect, useMemo, useState } from 'react';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachmentIcon from '@mui/icons-material/Attachment';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Paper,
  Stack,
  Typography,
  Avatar,
  CardMedia,
  Menu,
  MenuItem
} from "@mui/material";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { apiService } from '~/services/api';
import { useBoardStore } from '~/stores/boardStore';
import { shallow } from 'zustand/shallow';
import { toast } from 'react-toastify';
import UnsplashMenu from '~/components/UnsplashMenu/UnsplashMenu'; // <-- tích hợp UnsplashMenu

const CardDetailDialog = ({ open, onClose, card, onSaveDescription }) => {
  // store functions
  const storeAssign = useBoardStore((s) => s.assignCardMember);
  const storeUnassign = useBoardStore((s) => s.unassignCardMember);
  const boardMembers = useBoardStore((s) => s.board?.members ?? [], shallow);
  const updateCard = useBoardStore((s) => s.updateCard);

  // get latest card from store (fallback to prop)
  const storeCard = useBoardStore(s => {
    const cols = s.board?.columns ?? [];
    if (!card?.id || !card?.columnId) return null;
    const col = cols.find(c => c.id === card.columnId);
    return col?.cards?.find(c => c.id === card.id) ?? null;
  });
  const currentCard = storeCard ?? card;

  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(currentCard?.description ?? '');

  // member UI
  const [memberMenuAnchor, setMemberMenuAnchor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // cover menu + upload refs
  // const fileInputRef = useRef(null);

  // UnsplashMenu anchor (tách component)
  const [unsplashAnchor, setUnsplashAnchor] = useState(null);

  useEffect(() => {
    setDescription(currentCard?.description ?? '');
    setEditing(false);
  }, [currentCard?.id, currentCard?.description, currentCard?.cover]);

  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean']
    ]
  }), []);

  const handleSaveDescription = async () => {
    if (!currentCard) return;
    if (typeof onSaveDescription === 'function') onSaveDescription(currentCard, description);
    else console.log('Save description:', currentCard?.id, description);

    if (typeof updateCard === 'function') {
      await updateCard(currentCard.columnId, currentCard.id, { ...currentCard, description });
    } else {
      console.warn('[CardDetailDialog] updateCard not provided');
    }
    setEditing(false);
  };

  // --- Unsplash (tích hợp UnsplashMenu) ---
  const openAddCoverMenu = (e) => {
    // open the UnsplashMenu anchored to target
    setUnsplashAnchor(e.currentTarget);
  };
  const closeUnsplashMenu = () => {
    setUnsplashAnchor(null);
  };

  const handleSelectUnsplashImage = async (image) => {
    const url = image?.full ?? image?.thumb;
    if (!currentCard || !url) return;

    try {
      const success = await updateCard(currentCard.columnId, currentCard.id, { ...currentCard, cover: url });
      if (success) toast.success('Đã cập nhật cover từ Unsplash');
      else toast.error('Không thể cập nhật cover');
    } catch (err) {
      console.error('handleSelectUnsplashImage error', err);
      toast.error('Không thể cập nhật cover');
    } finally {
      closeUnsplashMenu();
    }
  };

  // --- File upload (version cũ) ---
  // const handleUploadClick = () => {
  //   // if any menu open, close it (we only use UnsplashMenu now)
  //   closeUnsplashMenu();
  //   fileInputRef.current?.click();
  // };

  // const handleFileChange = async (e) => {
  //   const file = e.target.files?.[0];
  //   if (!file || !currentCard) return;

  //   // Placeholder behavior — adapt to your actual upload endpoint
  //   try {
  //     const formData = new FormData();
  //     formData.append('file', file);

  //     // apiService.uploadFile should return { url: '...' } or similar
  //     const response = await apiService.uploadFile?.(formData);
  //     const url = response?.url;
  //     if (!url) {
  //       toast.error('Server không trả về URL ảnh');
  //       return;
  //     }

  //     const success = await updateCard(currentCard.columnId, currentCard.id, { ...currentCard, cover: url });
  //     if (success) toast.success('Đã cập nhật cover từ file upload');
  //     else toast.error('Không thể cập nhật cover');
  //   } catch (err) {
  //     console.error('handleFileChange error', err);
  //     toast.error('Lỗi khi tải ảnh lên');
  //   } finally {
  //     e.target.value = '';
  //   }
  // };

  // choose URL (kept)
  // const handleChooseUrl = async () => {
  //   closeUnsplashMenu();
  //   const url = window.prompt('Dán URL ảnh làm cover:');
  //   if (!url || !currentCard) return;

  //   try {
  //     const success = await updateCard(currentCard.columnId, currentCard.id, { ...currentCard, cover: url });
  //     if (success) toast.success('Đã cập nhật cover');
  //     else toast.error('Không thể cập nhật cover');
  //   } catch (err) {
  //     console.error('handleChooseUrl error', err);
  //     toast.error('Không thể cập nhật cover');
  //   }
  // };

  const handleDeleteCover = async () => {
    if (!currentCard) return;

    try {
      const success = await updateCard(currentCard.columnId, currentCard.id, { ...currentCard, cover: null });
      if (success) toast.success('Đã xoá cover');
      else toast.error('Không thể xoá cover');
    } catch (err) {
      console.error('handleDeleteCover error', err);
      toast.error('Không thể xoá cover');
    }
  };

  // --- member helpers & assign/unassign (giữ nguyên logic cũ) ---
  const getUserIdFrom = (item) => item?.user?.id ?? item?.userId ?? item?.id ?? null;
  const getUserEmailFrom = (item) => item?.user?.email ?? item?.email ?? item?.userEmail ?? null;
  const getDisplayNameFrom = (item) => item?.user?.userName ?? item?.user?.fullName ?? item?.fullName ?? item?.userName ?? item?.name ?? 'Unknown';
  const getAvatarFrom = (item) => item?.user?.avatar ?? item?.avatar ?? item?.avatarUrl ?? item?.user?.avatarUrl ?? null;
  const isUserAssignedToCard = (cardObj, userIdOrEmail) => {
    if (!cardObj?.members) return false;
    return cardObj.members.some(m => {
      const mid = m?.user?.id ?? m?.userId ?? m?.id ?? null;
      const memEmail = m?.user?.email ?? m?.email ?? null;
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
        const success = await storeAssign(currentCard.columnId, currentCard.id, email);
        if (!success) {
          // store should show toast if needed
        }
      } catch (err) {
        console.error('assign error:', err);
        toast.error('Gán thành viên thất bại');
      }
      return;
    }

    console.warn('No assignCardMember available (store or props)');
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
      return;
    }

    console.warn('No unassignCardMember available (store or props)');
  };

  // open member menu
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

  // search members (giữ nguyên logic)
  useEffect(() => {
    if (memberMenuAnchor == null) return;
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
          const name = (m?.user?.userName ?? m?.user?.fullName ?? '').toString().toLowerCase();
          const email = (m?.user?.email ?? '').toString().toLowerCase();
          const role = (m?.role ?? '').toString().toLowerCase();
          return name.includes(q) || email.includes(q) || role.includes(q);
        });
        const results = [...localMatches];
        if (results.length < 5) {
          try {
            const apiRes = await apiService.searchUsers(q, 1, 5);
            const remote = (apiRes?.items ?? []).filter(u => {
              const uid = getUserIdFrom(u);
              const email = getUserEmailFrom(u);
              return !boardMembers.some(bm => getUserIdFrom(bm) === uid || getUserEmailFrom(bm) === email);
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

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { height: '75vh' } }} data-no-dnd='true'>
      {/* header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
        <Typography sx={{ p: 1 }} variant="h6">{currentCard?.title ?? 'Card'}</Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* Add cover button */}
          <Button
            startIcon={<AddPhotoAlternateIcon />}
            variant="outlined"
            size="small"
            onClick={openAddCoverMenu}
          >
            Thêm cover
          </Button>

          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>

        {/* hidden file input */}
        {/* <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} /> */}

        {/* UnsplashMenu component (tách riêng) */}
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
        {/* Top 20%: cover */}
        <Box
          sx={{
            flex: '0 0 20%',
            position: 'relative',
            '&:hover .cover-overlay': { opacity: 1 }
          }}
        >
          {currentCard?.cover ? (
            <>
              <CardMedia
                component="img"
                src={currentCard?.cover}
                alt="cover"
                sx={{ height: '200px', width: '100%', objectFit: 'cover' }}
              />

              {/* overlay delete button - xuất hiện khi hover */}
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
                <IconButton size="small" onClick={handleDeleteCover} sx={{ bgcolor: 'rgba(255,255,255,0.7)' }}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
              <Typography color="text.secondary">No cover</Typography>
            </Box>
          )}
        </Box>

        {/* Bottom 80% */}
        <Box sx={{ flex: '1 1 80%', p: 2, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Box 1: actions */}
          <Paper sx={{ p: 1 }} elevation={0}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button startIcon={<AttachmentIcon />} variant="outlined">Đính kèm</Button>
            </Stack>
          </Paper>

          {/* Box 2: members */}
          <Paper sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1">Thành viên</Typography>
              <Button size="small" onClick={handleOpenMemberMenu}>Thêm</Button>
            </Box>
            <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
              {currentCard?.members?.length ? currentCard.members.map(m => {
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
              }) : <Typography color="text.secondary">Chưa có thành viên</Typography>}
            </Box>
          </Paper>

          {/* Member menu*/}
          <Menu
            anchorEl={memberMenuAnchor}
            open={Boolean(memberMenuAnchor)}
            onClose={handleCloseMemberMenu}
            PaperProps={{ sx: { width: 320, maxHeight: 300, p: 1, overflow: 'hidden' } }}
          >
            <Box sx={{ p: 1 }}>
              <input
                type="text"
                placeholder="Tìm kiếm các thành viên"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #ccc', outline: 'none' }}
              />
            </Box>

            <Box sx={{ maxHeight: 220, overflowY: 'auto' }}>
              {loadingMembers ? (
                <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                  Đang tải...
                </Typography>
              ) : (searchResults?.length ?? 0) === 0 ? (
                <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                  Không có kết quả
                </Typography>
              ) : (
                searchResults.slice(0, 5).map((item) => {
                  const uid = getUserIdFrom(item);
                  const displayName = getDisplayNameFrom(item);
                  const avatar = getAvatarFrom(item);
                  return (
                    <MenuItem
                      key={uid ?? Math.random().toString(36).slice(2)}
                      onClick={async () => { await assignHandler(item); handleCloseMemberMenu(); }}
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

          {/* Box 3: description using ReactQuill */}
          <Paper sx={{ p: 1, flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1">Mô tả</Typography>
              {!editing && (
                <Button size="small" startIcon={<EditIcon />} onClick={() => setEditing(true)}>
                  {description ? 'Chỉnh sửa' : 'Thêm'}
                </Button>
              )}
            </Box>

            <Box sx={{ mt: 1, flex: '1 1 auto', overflow: 'auto' }}>
              {editing ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{ flex: '1 1 auto' }}>
                    <ReactQuill theme="snow" value={description} onChange={setDescription} modules={modules} />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button variant="contained" size="small" onClick={handleSaveDescription}>Save</Button>
                    <Button variant="outlined" size="small" onClick={() => { setEditing(false); setDescription(currentCard?.description ?? ''); }}>Cancel</Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ minHeight: 120 }}>
                  <div dangerouslySetInnerHTML={{ __html: description || '<i style="color:#999">Không có mô tả</i>' }} />
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
