import { Box, Skeleton } from '@mui/material';

export default function ListCardsSkeleton({ count = 5 }) {
  return (
    <Box
      sx={{
        p: '0 5px 5px 5px',
        m: '0 5px',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        overflowX: 'hidden',
        overflowY: 'auto',
        maxHeight: (theme) => `calc(
          ${theme.custom?.boardContentHeight || 600}px -
          ${theme.spacing(5)} -
          ${theme.custom?.columnHeaderHeight || 40}px -
          ${theme.custom?.columnFooterHeight || 40}px
        )`,
        '&::-webkit-scrollbar-thumb': { backgroundColor: '#ced0da' },
        '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#dfc2cf' }
      }}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <Skeleton
          key={idx}
          variant="rectangular"
          width="100%"
          height={80} // chiều cao tương tự Card thật
          sx={{ borderRadius: 1 }}
        />
      ))}
    </Box>
  );
}