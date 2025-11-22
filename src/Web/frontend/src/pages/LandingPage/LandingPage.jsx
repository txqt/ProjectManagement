import { Box, Container, Typography, Button, Grid, Card, CardContent, useTheme, alpha } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import ThemeModeContext from '~/ThemeModeContext';
import ModeSelect from '~/components/ModeSelect/ModeSelect';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Timeline as TimelineIcon,
    Comment as CommentIcon,
    Notifications as NotificationsIcon,
    DevicesOther as DevicesIcon,
} from '@mui/icons-material';
import { keyframes } from '@mui/system';

// Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

export default function LandingPage() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { themeMode, setThemeMode } = useContext(ThemeModeContext);

    const features = [
        {
            icon: <DashboardIcon sx={{ fontSize: 48 }} />,
            title: 'Quản lý Board & Card',
            description: 'Tổ chức công việc với boards và cards linh hoạt, dễ dàng kéo thả và sắp xếp.',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
        {
            icon: <PeopleIcon sx={{ fontSize: 48 }} />,
            title: 'Cộng tác Real-time',
            description: 'Làm việc nhóm hiệu quả với cập nhật thời gian thực và mời thành viên dễ dàng.',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        },
        {
            icon: <TimelineIcon sx={{ fontSize: 48 }} />,
            title: 'Theo dõi Hoạt động',
            description: 'Xem lịch sử thay đổi và hoạt động của tất cả thành viên trong dự án.',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        },
        {
            icon: <CommentIcon sx={{ fontSize: 48 }} />,
            title: 'Bình luận & Trao đổi',
            description: 'Thảo luận trực tiếp trên từng card, giữ mọi cuộc trò chuyện có ngữ cảnh.',
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        },
        {
            icon: <NotificationsIcon sx={{ fontSize: 48 }} />,
            title: 'Thông báo Thông minh',
            description: 'Nhận thông báo về các thay đổi quan trọng và lời mời tham gia board.',
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        },
        {
            icon: <DevicesIcon sx={{ fontSize: 48 }} />,
            title: 'Responsive Design',
            description: 'Truy cập mọi lúc mọi nơi trên mọi thiết bị, từ desktop đến mobile.',
            gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        },
    ];

    const steps = [
        {
            number: '01',
            title: 'Tạo Board',
            description: 'Bắt đầu bằng cách tạo board mới cho dự án của bạn',
        },
        {
            number: '02',
            title: 'Thêm Tasks',
            description: 'Tạo columns và cards để tổ chức công việc',
        },
        {
            number: '03',
            title: 'Mời Team',
            description: 'Mời thành viên và cùng nhau hoàn thành mục tiêu',
        },
    ];

    return (
        <Box sx={{ minHeight: '100vh', overflow: 'hidden' }}>
            {/* Hero Section */}
            <Box
                sx={{
                    position: 'relative',
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    background: isDark
                        ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                    overflow: 'hidden',
                }}
            >
                {/* Animated background elements */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: '10%',
                        right: '10%',
                        width: '300px',
                        height: '300px',
                        borderRadius: '50%',
                        background: alpha('#fff', 0.1),
                        animation: `${float} 6s ease-in-out infinite`,
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: '15%',
                        left: '5%',
                        width: '200px',
                        height: '200px',
                        borderRadius: '50%',
                        background: alpha('#fff', 0.05),
                        animation: `${float} 8s ease-in-out infinite`,
                        animationDelay: '1s',
                    }}
                />

                {/* Theme Mode Select - Top Right */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        zIndex: 10,
                    }}
                >
                    <ModeSelect
                        value={themeMode}
                        onChange={setThemeMode}
                    />
                </Box>

                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                    <Box
                        sx={{
                            textAlign: 'center',
                            color: 'white',
                            animation: `${fadeInUp} 1s ease-out`,
                        }}
                    >
                        <Typography
                            variant="h1"
                            sx={{
                                fontSize: { xs: '2.5rem', md: '4rem', lg: '5rem' },
                                fontWeight: 800,
                                mb: 2,
                                background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.8) 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            Quản lý Dự án
                            <br />
                            Đơn giản & Hiệu quả
                        </Typography>

                        <Typography
                            variant="h5"
                            sx={{
                                fontSize: { xs: '1rem', md: '1.5rem' },
                                mb: 5,
                                opacity: 0.9,
                                maxWidth: '700px',
                                mx: 'auto',
                                fontWeight: 300,
                            }}
                        >
                            Tổ chức công việc, cộng tác nhóm và theo dõi tiến độ dự án
                            <br />
                            một cách trực quan với giao diện hiện đại
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={() => navigate('/register')}
                                sx={{
                                    px: 5,
                                    py: 2,
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    borderRadius: '50px',
                                    background: 'white',
                                    color: '#667eea',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        background: 'white',
                                        transform: 'translateY(-3px)',
                                        boxShadow: '0 15px 50px rgba(0,0,0,0.3)',
                                    },
                                }}
                            >
                                Bắt đầu ngay
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                onClick={() => navigate('/login')}
                                sx={{
                                    px: 5,
                                    py: 2,
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    borderRadius: '50px',
                                    borderColor: 'white',
                                    color: 'white',
                                    borderWidth: 2,
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        borderWidth: 2,
                                        borderColor: 'white',
                                        background: alpha('#fff', 0.1),
                                        transform: 'translateY(-3px)',
                                    },
                                }}
                            >
                                Đăng nhập
                            </Button>
                        </Box>
                    </Box>
                </Container>

                {/* Scroll indicator */}
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 40,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        animation: `${pulse} 2s ease-in-out infinite`,
                        zIndex: 2,
                    }}
                >
                    <Typography variant="body2" sx={{ mb: 1, opacity: 0.8, color: 'white' }}>
                        Khám phá thêm
                    </Typography>
                    <Box
                        sx={{
                            width: 30,
                            height: 50,
                            border: '2px solid white',
                            borderRadius: '15px',
                            mx: 'auto',
                            position: 'relative',
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 8,
                                left: '45%',
                                transform: 'translateX(-50%)',
                                width: 4,
                                height: 8,
                                background: 'white',
                                borderRadius: '2px',
                                animation: `${float} 2s ease-in-out infinite`,
                            },
                        }}
                    />
                </Box>
            </Box>

            {/* Features Section */}
            <Box
                sx={{
                    py: { xs: 8, md: 12 },
                    background: isDark ? '#0a0a0a' : '#f8f9fa',
                }}
            >
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 8 }}>
                        <Typography
                            variant="h2"
                            sx={{
                                fontSize: { xs: '2rem', md: '3rem' },
                                fontWeight: 700,
                                mb: 2,
                                background: isDark
                                    ? 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                                    : 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            Tính năng nổi bật
                        </Typography>
                        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                            Mọi thứ bạn cần để quản lý dự án hiệu quả
                        </Typography>
                    </Box>

                    <Grid container spacing={4}>
                        {features.map((feature, index) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        background: isDark
                                            ? alpha('#1a1a1a', 0.6)
                                            : 'rgba(255, 255, 255, 0.9)',
                                        backdropFilter: 'blur(10px)',
                                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                        borderRadius: 4,
                                        transition: 'all 0.3s ease',
                                        animation: `${fadeInUp} 0.6s ease-out ${index * 0.1}s backwards`,
                                        '&:hover': {
                                            transform: 'translateY(-10px)',
                                            boxShadow: `0 20px 40px ${alpha('#000', 0.15)}`,
                                            '& .feature-icon': {
                                                transform: 'scale(1.1) rotate(5deg)',
                                            },
                                        },
                                    }}
                                >
                                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                                        <Box
                                            className="feature-icon"
                                            sx={{
                                                width: 80,
                                                height: 80,
                                                borderRadius: '20px',
                                                background: feature.gradient,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mx: 'auto',
                                                mb: 3,
                                                color: 'white',
                                                transition: 'all 0.3s ease',
                                            }}
                                        >
                                            {feature.icon}
                                        </Box>
                                        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                                            {feature.title}
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary">
                                            {feature.description}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* How It Works Section */}
            <Box
                sx={{
                    py: { xs: 8, md: 12 },
                    background: isDark
                        ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                }}
            >
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 8 }}>
                        <Typography
                            variant="h2"
                            sx={{
                                fontSize: { xs: '2rem', md: '3rem' },
                                fontWeight: 700,
                                mb: 2,
                            }}
                        >
                            Cách sử dụng
                        </Typography>
                        <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 600, mx: 'auto' }}>
                            Chỉ 3 bước đơn giản để bắt đầu
                        </Typography>
                    </Box>

                    <Grid container spacing={6} alignItems="center">
                        {steps.map((step, index) => (
                            <Grid size={{ xs: 12, md: 4 }} key={index}>
                                <Box
                                    sx={{
                                        textAlign: 'center',
                                        animation: `${fadeInUp} 0.6s ease-out ${index * 0.2}s backwards`,
                                    }}
                                >
                                    <Typography
                                        variant="h1"
                                        sx={{
                                            fontSize: '5rem',
                                            fontWeight: 800,
                                            opacity: 0.2,
                                            mb: 2,
                                            background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.5) 100%)',
                                            backgroundClip: 'text',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}
                                    >
                                        {step.number}
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
                                        {step.title}
                                    </Typography>
                                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                                        {step.description}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* CTA Section */}
            <Box
                sx={{
                    py: { xs: 8, md: 12 },
                    background: isDark ? '#0a0a0a' : '#f8f9fa',
                    textAlign: 'center',
                }}
            >
                <Container maxWidth="md">
                    <Typography
                        variant="h2"
                        sx={{
                            fontSize: { xs: '2rem', md: '3rem' },
                            fontWeight: 700,
                            mb: 3,
                            background: isDark
                                ? 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                                : 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Sẵn sàng bắt đầu?
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                        Tạo tài khoản miễn phí và trải nghiệm ngay hôm nay
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => navigate('/register')}
                        sx={{
                            px: 6,
                            py: 2.5,
                            fontSize: '1.2rem',
                            fontWeight: 600,
                            borderRadius: '50px',
                            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-3px)',
                                boxShadow: '0 15px 40px rgba(102, 126, 234, 0.5)',
                            },
                        }}
                    >
                        Đăng ký miễn phí
                    </Button>
                </Container>
            </Box>

            {/* Footer */}
            <Box
                sx={{
                    py: 4,
                    background: isDark ? '#000' : '#fff',
                    borderTop: `1px solid ${theme.palette.divider}`,
                    textAlign: 'center',
                }}
            >
                <Container>
                    <Typography variant="body2" color="text.secondary">
                        © {new Date().getFullYear()} Project Management. Made with ❤️
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
}
