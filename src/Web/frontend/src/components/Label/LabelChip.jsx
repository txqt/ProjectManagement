import { Chip } from '@mui/material';

const LabelChip = ({ label, size = 'small', onDelete, onClick }) => {
  return (
    <Chip
      label={label.title}
      size={size}
      onDelete={onDelete}
      onClick={onClick}
      sx={{
        bgcolor: label.color,
        color: '#fff',
        fontWeight: 500,
        '&:hover': {
          bgcolor: label.color,
          opacity: 0.8,
        },
        '& .MuiChip-deleteIcon': {
          color: 'rgba(255, 255, 255, 0.7)',
          '&:hover': {
            color: '#fff',
          },
        },
      }}
    />
  );
};

export default LabelChip;