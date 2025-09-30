import { Box, Skeleton, Avatar, AvatarGroup, Button, Chip } from '@mui/material';

export default function BoardBarSkeleton() {
  return (
    <Box
      sx={(theme) => ({
        width: '100%',
        height: theme.custom?.boardBarHeight || 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        paddingX: 2,
        overflowX: 'auto',
        bgcolor: theme.palette.mode === 'dark' ? '#34495e' : '#1976b2'
      })}
    >
      {/* Left side */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Skeleton variant="rectangular" width={120} height={32} />
        <Skeleton variant="rectangular" width={80} height={32} />
        <Skeleton variant="rectangular" width={60} height={24} />
        <Skeleton variant="rectangular" width={140} height={32} />
        <Skeleton variant="rectangular" width={120} height={32} />
        <Skeleton variant="rectangular" width={80} height={32} />
      </Box>

      {/* Right side */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Skeleton variant="rectangular" width={100} height={36} />
        <AvatarGroup max={4} sx={{ gap: '10px' }}>
          {[...Array(4)].map((_, idx) => (
            <Skeleton
              key={idx}
              variant="circular"
              width={36}
              height={36}
            />
          ))}
        </AvatarGroup>
      </Box>
    </Box>
  );
}