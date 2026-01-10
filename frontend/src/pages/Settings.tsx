import { useState } from 'react';
import { Box, Card, Text, Flex, Heading, TextField, Button, Select } from '@radix-ui/themes';
import { settingsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export function Settings() {
  const { user, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [mode, setMode] = useState(user?.mode || 'FRIENDS');
  const [radiusMeters, setRadiusMeters] = useState(user?.radiusMeters?.toString() || '1000');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      await settingsApi.update({
        displayName: displayName || undefined,
        mode,
        radiusMeters: parseInt(radiusMeters),
      });
      await refreshUser();
      setMessage('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex direction="column" gap="4">
      <Box>
        <Heading size="6" mb="2" style={{ color: '#FFB000' }}>
          Settings
        </Heading>
        <Text size="2" style={{ color: '#666' }}>
          Friend Code: <strong>{user?.friendCode}</strong>
        </Text>
      </Box>

      <Card style={{ backgroundColor: '#FFF', border: '2px solid #FFD700' }}>
        <Flex direction="column" gap="4" p="4">
          <Box>
            <Text size="2" weight="bold" mb="2" style={{ color: '#000' }}>
              Display Name
            </Text>
            <TextField.Root
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              size="3"
              style={{ backgroundColor: '#FFFEF0' }}
            />
          </Box>

          <Box>
            <Text size="2" weight="bold" mb="2" style={{ color: '#000' }}>
              Visibility Mode
            </Text>
            <Select.Root value={mode} onValueChange={setMode} size="3">
              <Select.Trigger style={{ backgroundColor: '#FFFEF0' }} />
              <Select.Content>
                <Select.Item value="FRIENDS">Friends Only</Select.Item>
                <Select.Item value="OFF">Off</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>

          <Box>
            <Text size="2" weight="bold" mb="2" style={{ color: '#000' }}>
              Radar Radius (meters)
            </Text>
            <TextField.Root
              type="number"
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(e.target.value)}
              placeholder="1000"
              min="100"
              max="5000"
              size="3"
              style={{ backgroundColor: '#FFFEF0' }}
            />
            <Text size="1" style={{ color: '#999' }}>
              Range: 100-5000 meters
            </Text>
          </Box>

          <Button
            size="3"
            onClick={handleSave}
            disabled={loading}
            style={{
              backgroundColor: '#FFD700',
              color: '#000',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>

          {message && (
            <Text
              size="2"
              style={{
                color: message.includes('success') ? '#00AA00' : '#CC0000',
                textAlign: 'center',
              }}
            >
              {message}
            </Text>
          )}
        </Flex>
      </Card>
    </Flex>
  );
}
