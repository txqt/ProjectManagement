import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
} from "@mui/material";
import { CheckCircle, Cancel } from "@mui/icons-material";
import { apiService } from "~/services/api";
import { useApi } from "~/hooks/useApi";
import { InviteStatus } from "~/utils/constants";

export default function MyBoardInvite() {
  const { loading, error, executeRequest } = useApi();
  const [invites, setInvites] = useState([]);
  const [tab, setTab] = useState(InviteStatus.Pending);
  const [respondingId, setRespondingId] = useState(null);

  const loadInvites = async (status) => {
    const { success, data } = await executeRequest(() =>
      apiService.getMyInvites(status)
    );
    if (success) {
      setInvites(data || []);
    }
  };

  const handleRespond = async (inviteId, response) => {
    setRespondingId(inviteId);
    const { success } = await executeRequest(() =>
      apiService.respondToInvite(inviteId, response)
    );
    if (success) {
      await loadInvites(tab); // reload theo tab hiện tại
    }
    setRespondingId(null);
  };

  useEffect(() => {
    loadInvites(tab);
  }, [tab]);

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>
        Lời mời của tôi
      </Typography>

      {/* Tabs filter */}
      <Tabs
        value={tab}
        onChange={(_, newValue) => setTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ mb: 3 }}
      >
        <Tab value={InviteStatus.Pending} label="Đang chờ" />
        <Tab value={InviteStatus.Accepted} label="Đã chấp nhận" />
        <Tab value={InviteStatus.Declined} label="Đã từ chối" />
        <Tab value={InviteStatus.Expired} label="Hết hạn" />
        <Tab value={InviteStatus.Cancelled} label="Đã hủy" />
      </Tabs>

      {/* Loading state */}
      {loading && (
        <Box display="flex" justifyContent="center" mt={5}>
          <CircularProgress />
        </Box>
      )}

      {/* Error state */}
      {error && (
        <Typography color="error" mt={2}>
          Lỗi: {error}
        </Typography>
      )}

      {/* Empty state */}
      {!loading && invites.length === 0 && (
        <Typography mt={2}>Không có lời mời nào</Typography>
      )}

      {/* Invite list */}
      <Grid container spacing={2}>
        {invites.map((invite) => (
          <Grid item xs={12} md={6} lg={4} key={invite.id}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6">{invite.boardName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Người mời:{" "}
                  <Box component="span" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                    {invite.inviter.userName}
                  </Box>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Bạn đã từ chối lời mời vào{" "}
                  <Box component="span" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                    {invite.board.title}
                  </Box>
                </Typography>
                <Chip
                  label={invite.status}
                  color={
                    invite.status === InviteStatus.Pending
                      ? "warning"
                      : invite.status === InviteStatus.Accepted
                        ? "success"
                        : invite.status === InviteStatus.Declined
                          ? "error"
                          : "default"
                  }
                  size="small"
                  sx={{ mt: 1 }}
                />
              </CardContent>

              {invite.status === InviteStatus.Pending && (
                <CardActions>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<CheckCircle />}
                    disabled={respondingId === invite.id}
                    onClick={() => handleRespond(invite.id, "accept")}
                  >
                    {respondingId === invite.id ? (
                      <CircularProgress size={20} />
                    ) : (
                      "Chấp nhận"
                    )}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<Cancel />}
                    disabled={respondingId === invite.id}
                    onClick={() => handleRespond(invite.id, "decline")}
                  >
                    {respondingId === invite.id ? (
                      <CircularProgress size={20} />
                    ) : (
                      "Từ chối"
                    )}
                  </Button>
                </CardActions>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}