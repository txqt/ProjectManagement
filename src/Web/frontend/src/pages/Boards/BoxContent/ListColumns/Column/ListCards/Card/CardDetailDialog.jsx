import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachmentIcon from '@mui/icons-material/Attachment';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { Box, Button, Dialog, DialogContent, IconButton, Paper, Stack, Typography, Avatar, CardMedia, Menu, MenuItem } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const CardDetailDialog = ({ open, onClose, card, onSaveDescription, onChangeCover, onDeleteCover, updateCard }) => {
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(card?.description ?? '');
  const [localCover, setLocalCover] = useState(card?.cover ?? null);

  // menu for add-cover button
  const [anchorEl, setAnchorEl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setDescription(card?.description ?? '');
    setEditing(false);
    setLocalCover(card?.cover ?? null);
  }, [card?.id, card?.description, card?.cover]);

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
    if (typeof onSaveDescription === 'function') onSaveDescription(card, description);
    else console.log('Save description:', card?.id, description);
    await updateCard(card.columnId, card.id, {...card, description: description})
    setEditing(false);
  };

  // --- Cover handlers ---
  const openAddCoverMenu = (e) => setAnchorEl(e.currentTarget);
  const closeAddCoverMenu = () => setAnchorEl(null);

  const handleUploadClick = () => {
    closeAddCoverMenu();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // preview as data URL
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setLocalCover(dataUrl);
      // Nếu muốn upload lên server, tốt nhất gửi `file`. Ở đây gọi callback với { file, dataUrl }.
      if (typeof onChangeCover === 'function') onChangeCover(card, { file, dataUrl });
      else console.log('Cover uploaded (file):', card?.id, file);
    };
    reader.readAsDataURL(file);
    // reset input so same file can be selected again if needed
    e.target.value = '';
  };

  const handleChooseUrl = () => {
    closeAddCoverMenu();
    const url = window.prompt('Dán URL ảnh làm cover:');
    if (!url) return;
    setLocalCover(url);
    if (typeof onChangeCover === 'function') onChangeCover(card, { url });
    else console.log('Cover set by URL:', card?.id, url);
  };

  const handleDeleteCover = () => {
    setLocalCover(null);
    if (typeof onDeleteCover === 'function') onDeleteCover(card);
    else console.log('Delete cover:', card?.id);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { height: '75vh' } }} data-no-dnd='true'>
      {/* header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
        <Typography sx={{ p: 1 }} variant="h6">{card?.title ?? 'Card'}</Typography>

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
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* menu */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeAddCoverMenu}>
          <MenuItem onClick={handleUploadClick}>
            <UploadFileIcon fontSize="small" sx={{ mr: 1 }} /> Upload từ máy
          </MenuItem>
          <MenuItem onClick={handleChooseUrl}>
            <AddPhotoAlternateIcon fontSize="small" sx={{ mr: 1 }} /> Chọn từ URL
          </MenuItem>
        </Menu>
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
          {localCover ? (
            <>
              <CardMedia
                component="img"
                src={localCover}
                alt="cover"
                sx={{ height: '100%', width: '100%', objectFit: 'cover' }}
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
              <Button size="small">Thêm</Button>
            </Box>
            <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
              {card?.members?.length ? card.members.map(m => (
                <Avatar key={m.id || m} alt={m.name ?? m} sx={{ width: 32, height: 32 }}>
                  {m.name ? m.name[0].toUpperCase() : '?'}
                </Avatar>
              )) : <Typography color="text.secondary">Chưa có thành viên</Typography>}
            </Box>
          </Paper>

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
                  <Box sx={{
                    flex: '1 1 auto'
                  }}>
                    <ReactQuill theme="snow" value={description} onChange={setDescription} modules={modules} />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button variant="contained" size="small" onClick={handleSaveDescription}>Save</Button>
                    <Button variant="outlined" size="small" onClick={() => { setEditing(false); setDescription(card?.description ?? ''); }}>Cancel</Button>
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