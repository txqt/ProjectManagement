import { Box, Tooltip } from "@mui/material";
import Chip from '@mui/material/Chip';
import DashboardIcon from '@mui/icons-material/Dashboard';
import VpnLockIcon from '@mui/icons-material/VpnLock';
import AddToDrive from "@mui/icons-material/AddToDrive";
import BoltIcon from '@mui/icons-material/Bolt';
import FilterListIcon from '@mui/icons-material/FilterList';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Button from "@mui/material/Button";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { capitalizeFirstLetter } from "~/utils/formatter";

const MENU_STYPES = {
    color: 'white',
    bgcolor: 'transparent',
    border: 'none',
    paddingX: '5px',
    borderRadius: '4px',
    '.MuiSvgIcon-root': {
        color: 'white'
    },
    '&:hover': {
        bgcolor: 'primary.50'
    }
}

function BoardBar({ board }) {

    return (
        <Box
            sx={(theme) => ({
                width: "100%",
                height: theme.custom.boardBarHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: 'space-between',
                gap: 2,
                paddingX: 2,
                overflowX: 'auto',
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#34495e' : '#1976b2'),
            })}
        >
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2
            }}>
                <Chip
                    sx={MENU_STYPES}
                    icon={<DashboardIcon />}
                    label={board?.title}
                    clickable
                />
                <Chip
                    sx={MENU_STYPES}
                    icon={<VpnLockIcon />}
                    label={capitalizeFirstLetter(board?.type)}
                    clickable
                />
                <Chip
                    sx={MENU_STYPES}
                    icon={<AddToDrive />}
                    label="Add to Google Drive"
                    clickable
                />
                <Chip
                    sx={MENU_STYPES}
                    icon={<BoltIcon />}
                    label="Automation"
                    clickable
                />
                <Chip
                    sx={MENU_STYPES}
                    icon={<FilterListIcon />}
                    label="Filters"
                    clickable
                />
            </Box>

            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2
            }}>
                <Button
                    variant="outlined"
                    startIcon={<PersonAddIcon />}
                    sx={{
                        color: 'white',
                        borderColor: 'white',
                        '&:hover': { borderColor: 'white' }
                    }}
                >
                    Invite
                </Button>
                <AvatarGroup
                    max={4}
                    sx={{
                        gap: '10px',
                        '& .MuiAvatar-root': {
                            width: 36,
                            height: 36,
                            fontSize: 16,
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            '&:first-of-type': { bgcolor: '#a4b0be' }
                        }
                    }}
                >
                    <Tooltip title="txqt">
                        <Avatar
                            alt="txqt"
                            src="https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/avatar_vo_tri_a49436c5de.jpg"
                        />
                    </Tooltip>
                    <Tooltip title="txqt">
                        <Avatar
                            alt="txqt"
                            src="https://cdn-media.sforum.vn/storage/app/media/wp-content/uploads/2023/11/avatar-vo-tri-thumbnail.jpg"
                        />
                    </Tooltip>
                    <Tooltip title="txqt">
                        <Avatar
                            alt="txqt"
                            src="https://sm.ign.com/ign_pk/cover/a/avatar-gen/avatar-generations_rpge.jpg"
                        />
                    </Tooltip>
                    <Tooltip title="txqt">
                        <Avatar
                            alt="txqt"
                            src="https://cdn2.tuoitre.vn/zoom/700_700/2019/5/8/avatar-publicitystill-h2019-1557284559744252594756-crop-15572850428231644565436.jpg"
                        />
                    </Tooltip>
                    <Tooltip title="txqt">
                        <Avatar
                            alt="txqt"
                            src="https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/avatar_dep_cho_nam_0_d82ba08b05.jpg"
                        />
                    </Tooltip>
                    <Tooltip title="txqt">
                        <Avatar
                            alt="txqt"
                            src="https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/small/avatar_hoat_hinh_db4e0e9cf4.jpg"
                        />
                    </Tooltip>
                </AvatarGroup>
            </Box>
        </Box>
    )
}

export default BoardBar