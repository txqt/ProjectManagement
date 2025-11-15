// components/CardDetails/LabelsSection.jsx
import React from 'react';
import { Box, IconButton, Paper, Typography } from '@mui/material';
import LabelIcon from '@mui/icons-material/Label';
import LabelChip from '~/components/Label/LabelChip';
import { useBoardStore } from '~/stores/boardStore';

export default function LabelsSection({ card, onOpenLabelSelector }) {
    const removeLabelFromCard = useBoardStore(s => s.removeLabelFromCard);

    if (!card) return null;

    return (
        <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LabelIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                <Typography variant="subtitle2" fontWeight={600}>Labels</Typography>
            </Box>

            <Paper sx={{ p: 2, mt: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    {card.labels?.map((label) => (
                        <LabelChip
                            key={label.id}
                            label={label}
                            onDelete={() => removeLabelFromCard(card.columnId, card.id, label.id)}
                        />
                    ))}
                    <IconButton
                        size="small"
                        onClick={onOpenLabelSelector}
                        sx={{
                            width: 32,
                            height: 32,
                            bgcolor: 'action.hover',
                            '&:hover': { bgcolor: 'action.selected' }
                        }}
                    >
                        <LabelIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Paper>
        </Box>
    );
}