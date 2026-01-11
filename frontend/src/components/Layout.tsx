import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Flex, Box, Button, Text, Container } from '@radix-ui/themes';
import { HomeIcon, GearIcon, PersonIcon, ExitIcon } from '@radix-ui/react-icons';
import { useAuth } from '../contexts/AuthContext';
import { semanticColors } from '../lib/colors';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/register');
  };

  return (
    <Flex direction="column" style={{ minHeight: '100vh', backgroundColor: semanticColors.appBg }}>
      {/* Header */}
      <Box
        className="py-4"
        style={{
          backgroundColor: semanticColors.componentBg,
          borderBottom: `2px solid ${semanticColors.accentSolid}`,
        }}
      >
        <Container size="4">
          <Flex justify="between" align="center">
            <Text size="6" weight="bold" style={{ color: semanticColors.accentText }}>
              🐝 Beepd
            </Text>
            {user && (
              <Flex gap="2" align="center">
                <Link to="/" style={{ textDecoration: 'none' }}>
                  <Button variant="ghost" size="2" style={{ color: semanticColors.accentText }}>
                    <HomeIcon width="18" height="18" />
                  </Button>
                </Link>
                <Link to="/friends" style={{ textDecoration: 'none' }}>
                  <Button variant="ghost" size="2" style={{ color: semanticColors.accentText }}>
                    <PersonIcon width="18" height="18" />
                  </Button>
                </Link>
                <Link to="/settings" style={{ textDecoration: 'none' }}>
                  <Button variant="ghost" size="2" style={{ color: semanticColors.accentText }}>
                    <GearIcon width="18" height="18" />
                  </Button>
                </Link>
                <Text size="2" style={{ color: semanticColors.lowContrastText, marginLeft: '8px' }}>
                  {user.displayName || user.friendCode}
                </Text>
                <Button
                  variant="ghost"
                  size="2"
                  onClick={handleLogout}
                  style={{ color: semanticColors.accentText }}
                >
                  <ExitIcon />
                </Button>
              </Flex>
            )}
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Box className="flex-1 py-8" style={{ flex: 1 }}>
        <Container size="3">
          <Outlet />
        </Container>
      </Box>

      {/* Footer */}
      <Box
        className="py-3"
        style={{
          backgroundColor: semanticColors.componentBg,
          borderTop: `2px solid ${semanticColors.accentSolid}`,
        }}
      >
        <Container size="4">
          <Flex justify="center">
            <Text size="2" style={{ color: semanticColors.lowContrastText }}>
              Elliott Schmechel @ JourneyHacks2026
            </Text>
          </Flex>
        </Container>
      </Box>
    </Flex>
  );
}
