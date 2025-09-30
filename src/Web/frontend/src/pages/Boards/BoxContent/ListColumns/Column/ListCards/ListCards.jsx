import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Card from './Card/Card';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { memo, useCallback, useState } from 'react';
import ListCardsSkeleton from './ListCardsSkeleton';

const ListCards = memo(({ cards, deleteCard, onEdit /* optional */ }) => {
    // menu state: position-based (use anchorReference="anchorPosition")
    const [menuPos, setMenuPos] = useState(null); // { mouseX, mouseY }
    const [selectedCard, setSelectedCard] = useState(null);

    const openMenu = useCallback((event, card) => {
        event.preventDefault();
        // stopPropagation in case parent draggable handles right click
        event.stopPropagation();

        setSelectedCard(card);
        setMenuPos({
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6
        });
    }, []);

    const closeMenu = useCallback(() => {
        setMenuPos(null);
        setSelectedCard(null);
    }, []);

    const handleEdit = useCallback(() => {
        closeMenu();
        if (typeof onEdit === 'function') {
            onEdit(selectedCard);
        } else {
            // placeholder — bạn có thể mở modal edit ở đây
            console.log('Edit requested for', selectedCard);
        }
    }, [onEdit, selectedCard, closeMenu]);

    const handleDelete = useCallback(async () => {
        closeMenu();
        if (!selectedCard) return;

        // assume deleteCard signature is (columnId, cardId)
        if (typeof deleteCard === 'function') {
            // nếu card có columnId dùng card.columnId, nếu không, chỉ truyền card.id
            try {
                await deleteCard(selectedCard.columnId, selectedCard.id);
            } catch (e) {
                console.error('deleteCard error', e);
            }
        } else {
            console.warn('deleteCard prop not provided');
        }
    }, [deleteCard, selectedCard, closeMenu]);

    if (!cards) return <ListCardsSkeleton count={5} />;

    return (
        <>
            <SortableContext
                items={cards?.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
            >
                <Box
                    sx={{
                        p: '0 5px 5px 5px', // padding
                        m: '0 5px', // margin
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        overflowX: 'hidden',
                        overflowY: 'auto',
                        maxHeight: (theme) => `calc(
                        ${theme.custom.boardContentHeight} -
                        ${theme.spacing(5)} -
                        ${theme.custom.columnHeaderHeight} -
                        ${theme.custom.columnFooterHeight}
                        )`,
                        '&::-webkit-scrollbar-thumb': { backgroundColor: '#ced0da' },
                        '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#dfc2cf' }
                    }}
                >
                    {cards?.map((card) => (
                        // wrapper để bắt sự kiện chuột phải. Nếu Card đã gắn draggable root,
                        // có thể thay bằng truyền prop onContextMenu vào Card để tránh bọc thêm DOM.
                        <div
                            key={card.id}
                            onContextMenu={(e) => openMenu(e, card)}
                            style={{ display: 'contents' }} // không tạo box layout thêm
                        >
                            <Card card={card} />
                        </div>
                    ))}
                </Box>
            </SortableContext>

            <Menu
                open={!!menuPos}
                onClose={closeMenu}
                anchorReference="anchorPosition"
                anchorPosition={menuPos ? { top: menuPos.mouseY, left: menuPos.mouseX } : undefined}
                PaperProps={{ onContextMenu: (e) => e.preventDefault() }} // prevent menu from triggering new context menu
            >
                <MenuItem onClick={handleEdit}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Edit</ListItemText>
                </MenuItem>

                <MenuItem onClick={handleDelete}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
});

export default ListCards;