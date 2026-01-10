import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Flex, Box, Button, Text, Container } from '@radix-ui/themes';
import { HomeIcon, GearIcon, PersonIcon, ExitIcon } from '@radix-ui/react-icons';
import { useAuth } from '../contexts/AuthContext';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/register');
  };

  return (
    <Flex direction="column" style={{ minHeight: '100vh', backgroundColor: '#FFFEF0' }}>
      {/* Header */}
      <Box
        style={{
          backgroundColor: '#FFF',
          borderBottom: '2px solid #FFD700',
          padding: '1rem 0',
        }}
      >
        <Container size="4">
          <Flex justify="between" align="center">
            <Text size="6" weight="bold" style={{ color: '#FFB000' }}>
              Proximity Radar
            </Text>
            {user && (
              <Flex gap="2" align="center">
                <Text size="2" style={{ color: '#666' }}>
                  {user.displayName || user.friendCode}
                </Text>
                <Button
                  variant="ghost"
                  size="2"
                  onClick={handleLogout}
                  style={{ color: '#FFB000' }}
                >
                  <ExitIcon />
                </Button>
              </Flex>
            )}
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Box style={{ flex: 1, padding: '2rem 0' }}>
        <Container size="3">
          <Outlet />
        </Container>
      </Box>

      {/* Bottom Navigation */}
      {user && (
        <Box
          style={{
            backgroundColor: '#FFF',
            borderTop: '2px solid #FFD700',
            padding: '0.75rem 0',
          }}
        >
          <Container size="4">
            <Flex justify="between">
              <Link to="/" style={{ textDecoration: 'none' }}>
                <Button variant="ghost" size="3" style={{ color: '#FFB000' }}>
                  <HomeIcon width="20" height="20" />
                </Button>
              </Link>
              <Link to="/friends" style={{ textDecoration: 'none' }}>
                <Button variant="ghost" size="3" style={{ color: '#FFB000' }}>
                  <PersonIcon width="20" height="20" />
                </Button>
              </Link>
              <Link to="/settings" style={{ textDecoration: 'none' }}>
                <Button variant="ghost" size="3" style={{ color: '#FFB000' }}>
                  <GearIcon width="20" height="20" />
                </Button>
              </Link>
            </Flex>
          </Container>
        </Box>
      )}
    </Flex>
  );
}
