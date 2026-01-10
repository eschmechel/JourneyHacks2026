import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, Text, Flex, Heading } from '@radix-ui/themes';
import { useAuth } from '../contexts/AuthContext';

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
    <Flex direction="column" align="center" justify="center" style={{ minHeight: '60vh' }}>
      <Card style={{ maxWidth: '400px', width: '100%', backgroundColor: '#FFF', border: '2px solid #FFD700' }}>
        <Flex direction="column" gap="4" p="5">
          <Box style={{ textAlign: 'center' }}>
            <Heading size="8" mb="2" style={{ color: '#FFB000' }}>
              Welcome
            </Heading>
            <Text size="3" style={{ color: '#666' }}>
              Register your device to start tracking nearby friends
            </Text>
          </Box>

          <Button
            size="3"
            onClick={handleRegister}
            disabled={loading}
            style={{
              backgroundColor: '#FFD700',
              color: '#000',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Registering...' : 'Register Device'}
          </Button>

          <Text size="2" style={{ color: '#999', textAlign: 'center' }}>
            Your device will be assigned a unique friend code
          </Text>

          <Box style={{ textAlign: 'center' }}>
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
