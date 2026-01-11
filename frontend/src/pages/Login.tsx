import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, Heading, TextField, Button, Text, Flex } from '@radix-ui/themes';
import { useAuth } from '../contexts/AuthContext';
import { semanticColors } from '../lib/colors';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [deviceSecret, setDeviceSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(deviceSecret.trim());
      navigate('/');
    } catch (err) {
      console.error('Login failed:', err);
      setError('Invalid device secret. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setDeviceSecret('847bdc04-f607-4774-9646-5cd2318a2e83');
  };

  const handleFrankDemoLogin = () => {
    setDeviceSecret('e52bcb99-c0c1-4ebc-9491-9aebf442c1b4');
  };

  return (
    <Box className="min-h-screen flex items-center justify-center p-4">
      <Card size="4" className="w-full max-w-md">
        <Heading size="6" className="mb-4">Login to Proximity Radar</Heading>
        
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            <Box>
              <Text as="label" size="2" weight="bold" className="mb-1">
                Device Secret
              </Text>
              <TextField.Root
                placeholder="Paste your device secret here"
                value={deviceSecret}
                onChange={(e) => setDeviceSecret(e.target.value)}
                disabled={isLoading}
                size="3"
              />
              <Text size="1" color="gray" className="mt-1">
                Enter your device secret to login
              </Text>
            </Box>

            {error && (
              <Text color="red" size="2">
                {error}
              </Text>
            )}

            <Button 
              type="submit" 
              size="3" 
              disabled={isLoading || !deviceSecret.trim()}
              style={{ width: '100%' }}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>

            <Box style={{ textAlign: 'center' }}>
              <Text size="2" color="gray">
                Don't have an account?{' '}
                <Text
                  as="span"
                  color="blue"
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => navigate('/register')}
                >
                  Register
                </Text>
              </Text>
            </Box>

            <Box className="p-4 rounded-lg" style={{ backgroundColor: semanticColors.accentBg, borderTop: `1px solid ${semanticColors.accentSolid}` }}>
              <Text size="2" weight="bold" className="mb-2 block">
                🎮 Try Demo Mode:
              </Text>
              <Flex direction="column" gap="2">
                <Button 
                  type="button"
                  size="2" 
                  variant="soft"
                  onClick={handleDemoLogin}
                  style={{ width: '100%' }}
                >
                  Use Alice Demo Account
                </Button>
                <Button 
                  type="button"
                  size="2" 
                  variant="soft"
                  onClick={handleFrankDemoLogin}
                  style={{ width: '100%' }}
                >
                  Use Frank Demo Account
                </Button>
              </Flex>
              <Text size="1" color="gray" className="mt-1 block">
                See hardcoded friends at Vancouver Convention Centre
              </Text>
            </Box>
          </Flex>
        </form>
      </Card>
    </Box>
  );
}
