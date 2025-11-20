import { create } from 'zustand';
import { createBoardSlice } from './slices/boardSlice';
import { createColumnSlice } from './slices/columnSlice';
import { createCardSlice } from './slices/cardSlice';
import { createCommentSlice } from './slices/commentSlice';
import { createAttachmentSlice } from './slices/attachmentSlice';
import { createLabelSlice } from './slices/labelSlice';
import { createChecklistSlice } from './slices/checklistSlice';
import { createMiscSlice } from './slices/miscSlice';

export const useBoardStore = create((set, get) => ({
    ...createBoardSlice(set, get),
    ...createColumnSlice(set, get),
    ...createCardSlice(set, get),
    ...createCommentSlice(set, get),
    ...createAttachmentSlice(set, get),
    ...createLabelSlice(set, get),
    ...createChecklistSlice(set, get),
    ...createMiscSlice(set, get),
}));