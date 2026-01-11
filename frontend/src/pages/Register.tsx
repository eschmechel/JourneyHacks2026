import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, Text, Flex, Heading } from '@radix-ui/themes';
import { useAuth } from '../contexts/AuthContext';
import { semanticColors } from '../lib/colors';

export function Register() {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    setLoading(true);
    try {
      await register();
      navigate('/');
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex direction="column" align="center" justify="center" className="min-h-[60vh]">
      <Card className="max-w-md w-full" style={{ backgroundColor: semanticColors.componentBg, border: `2px solid ${semanticColors.accentSolid}` }}>
        <Flex direction="column" gap="4" className="p-5">
          <Box className="text-center">
            <Heading size="8" className="mb-2" style={{ color: semanticColors.accentText }}>
              Welcome
            </Heading>
            <Text size="3" style={{ color: semanticColors.lowContrastText }}>
              Register your device to start tracking nearby friends
            </Text>
          </Box>

          <Button
            size="3"
            onClick={handleRegister}
            disabled={loading}
            style={{
              backgroundColor: semanticColors.accentSolid,
              color: semanticColors.highContrastText,
              cursor: 'pointer',
            }}
          >
            {loading ? 'Registering...' : 'Register Device'}
          </Button>

          <Text size="2" className="text-center" style={{ color: semanticColors.lowContrastText }}>
            Your device will be assigned a unique friend code
          </Text>

          <Box className="text-center">
            <Text size="2" color="gray">
              Already have an account?{' '}
              <Text
                as="span"
                color="blue"
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => navigate('/login')}
              >
                Login
              </Text>
            </Text>
          </Box>
        </Flex>
      </Card>
    </Flex>
  );
}
