// UnsplashMenu.jsx
import React, { useEffect, useState } from 'react';
import { Box, Button, Menu, Typography } from '@mui/material';

/**
 * UnsplashMenu
 * Props:
 *  - anchorEl: element to anchor the Menu (like MUI Menu)
 *  - open: optional boolean (if you prefer controlled open state)
 *  - onClose: () => void
 *  - onSelect: (image) => void   // receives selected image object { id, thumb, full }
 *  - apiService: object with method searchUnsplash(query, perPage) returning array of images
 *  - maxHeight, width: layout control
 *
 * The component manages gallery / search UI and fetches images using apiService.
 */

export default function UnsplashMenu({
  anchorEl,
  open: controlledOpen,
  onClose,
  onSelect,
  apiService,
  width = 520,
  maxHeight = 520,
}) {
  const open = typeof controlledOpen === 'boolean' ? controlledOpen : Boolean(anchorEl);

  const [view, setView] = useState('gallery'); // 'gallery' | 'search'
  const [images, setImages] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchImages = async (q = 'wallpaper') => {
    setLoading(true);
    try {
      const items = await (apiService?.searchUnsplash ? apiService.searchUnsplash(q, 12) : []);
      const mapped = (items || []).map(i => ({
        id: i.id ?? Math.random().toString(36).slice(2),
        thumb: i.urls?.small ?? i.urls?.thumb ?? i.thumb ?? null,
        full: i.urls?.regular ?? i.urls?.full ?? i.full ?? null,
        raw: i,
      }));
      setImages(mapped);
    } catch (err) {
      console.error('UnsplashMenu.fetchImages error', err);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    // when menu opens, reset to gallery and fetch default
    setView('gallery');
    setQuery('');
    fetchImages('wallpaper');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const performSearch = async (q) => {
    const qq = (q || query || '').trim();
    if (!qq) return;
    await fetchImages(qq);
  };

  const handleSelect = (img) => {
    if (typeof onSelect === 'function') onSelect(img);
    if (typeof onClose === 'function') onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width, maxHeight, p: 1, overflow: 'hidden' } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1, pb: 1 }}>
        <Typography variant="subtitle1">Chọn cover</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* these buttons are intentionally small/simple so parent can still offer upload/url actions */}
          <Button size="small" onClick={() => { /* placeholder - parent can use its own handler */ }}>Upload</Button>
          <Button size="small" onClick={() => { /* placeholder - parent can use its own handler */ }}>URL</Button>
          {view === 'gallery' ? (
            <Button size="small" onClick={() => setView('search')}>Tìm ảnh</Button>
          ) : (
            <Button size="small" onClick={() => { setView('gallery'); fetchImages(); }}>Gallery</Button>
          )}
        </Box>
      </Box>

      {view === 'search' ? (
        <Box sx={{ px: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') performSearch(); }}
              placeholder="Nhập từ khoá tìm kiếm (ví dụ: beach, nature)"
              style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid #ccc' }}
            />
            <Button size="small" onClick={() => performSearch()}>Tìm</Button>
          </Box>

          <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
            {loading ? (
              <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>Đang tìm...</Typography>
            ) : images.length === 0 ? (
              <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>Chưa có kết quả</Typography>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1 }}>
                {images.map(img => (
                  <Box key={img.id} sx={{ cursor: 'pointer', position: 'relative' }}>
                    <img src={img.thumb} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6 }} />
                    <Button
                      size="small"
                      onClick={() => handleSelect(img)}
                      sx={{ position: 'absolute', bottom: 6, left: 6, bgcolor: 'rgba(255,255,255,0.9)' }}
                    >
                      Chọn
                    </Button>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      ) : (
        <Box sx={{ px: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <Button size="small" onClick={() => fetchImages('wallpaper')}>Wallpaper</Button>
            <Button size="small" onClick={() => fetchImages('nature')}>Nature</Button>
            <Button size="small" onClick={() => fetchImages('city')}>City</Button>
          </Box>

          <Box sx={{ maxHeight: 390, overflowY: 'auto' }}>
            {loading ? (
              <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>Đang tải...</Typography>
            ) : images.length === 0 ? (
              <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>Không có ảnh</Typography>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1 }}>
                {images.map(img => (
                  <Box key={img.id} sx={{ cursor: 'pointer', position: 'relative' }}>
                    <img src={img.thumb} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6 }} />
                    <Button
                      size="small"
                      onClick={() => handleSelect(img)}
                      sx={{ position: 'absolute', bottom: 6, left: 6, bgcolor: 'rgba(255,255,255,0.9)' }}
                    >
                      Chọn
                    </Button>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Menu>
  );
}