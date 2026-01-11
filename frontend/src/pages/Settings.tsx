import { useState, useEffect } from 'react';
import { Box, Card, Text, Flex, Heading, TextField, Button, Select, Switch } from '@radix-ui/themes';
import { settingsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { semanticColors } from '../lib/colors';

export function Settings() {
  const { user, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [mode, setMode] = useState(user?.mode || 'FRIENDS');
  const [radiusMeters, setRadiusMeters] = useState(user?.radiusMeters?.toString() || '1000');
  const [showFriendsOnMap, setShowFriendsOnMap] = useState(user?.showFriendsOnMap || false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setMode(user.mode || 'FRIENDS');
      setRadiusMeters(user.radiusMeters?.toString() || '1000');
      setShowFriendsOnMap(user.showFriendsOnMap || false);
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      const isAliceDemo = localStorage.getItem('deviceSecret') === '847bdc04-f607-4774-9646-5cd2318a2e83';
      const isFrankDemo = localStorage.getItem('deviceSecret') === 'e52bcb99-c0c1-4ebc-9491-9aebf442c1b4';
      
      if (isAliceDemo || isFrankDemo) {
        const storageKey = isAliceDemo ? 'alice-demo-settings' : 'frank-demo-settings';
        // For demo, save to localStorage
        const settings = {
          displayName: displayName || (isAliceDemo ? 'Alice' : 'Frank'),
          mode,
          radiusMeters: parseInt(radiusMeters),
          showFriendsOnMap,
        };
        localStorage.setItem(storageKey, JSON.stringify(settings));
        
        // Update the user state to reflect changes
        await refreshUser();
        
        setTimeout(() => {
          setMessage('Settings saved! (Demo mode - stored locally)');
          setLoading(false);
        }, 500);
        return;
      }
      
      const updateData = {
        displayName: displayName || undefined,
        mode,
        radiusMeters: parseInt(radiusMeters),
        showFriendsOnMap,
      };
      console.log('Saving settings:', updateData);
      const response = await settingsApi.update(updateData);
      console.log('Settings saved, response:', response.data);
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
        <Heading size="6" className="mb-2" style={{ color: semanticColors.accentText }}>
          Settings
        </Heading>
        <Text size="2" style={{ color: semanticColors.lowContrastText }}>
          Friend Code: <strong>{user?.friendCode}</strong>
        </Text>
      </Box>

      <Card style={{ backgroundColor: semanticColors.componentBg, border: `2px solid ${semanticColors.accentSolid}` }}>
        <Flex direction="column" gap="4" className="p-4">
          <Box>
            <Text size="2" weight="bold" className="mb-2" style={{ color: semanticColors.highContrastText }}>
              Display Name
            </Text>
            <TextField.Root
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              size="3"
              style={{ backgroundColor: semanticColors.subtleBg }}
            />
          </Box>

          <Box>
            <Text size="2" weight="bold" className="mb-2" style={{ color: semanticColors.highContrastText }}>
              Visibility Mode
            </Text>
            <Select.Root value={mode} onValueChange={setMode} size="3">
              <Select.Trigger style={{ backgroundColor: semanticColors.subtleBg }} />
              <Select.Content>
                <Select.Item value="FRIENDS">Friends Only</Select.Item>
                <Select.Item value="EVERYONE">Everyone</Select.Item>
                <Select.Item value="OFF">Off</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>

          <Box>
            <Flex align="center" gap="3">
              <Switch
                checked={showFriendsOnMap}
                onCheckedChange={setShowFriendsOnMap}
                size="3"
                style={{ backgroundColor: showFriendsOnMap ? semanticColors.accentSolid : semanticColors.subtleBg }}
              />
              <Box>
                <Text size="2" weight="bold" style={{ color: semanticColors.highContrastText }}>
                  Show friends on map
                </Text>
                <Text size="1" style={{ color: semanticColors.lowContrastText }}>
                  Allow friends to see your location on the map
                </Text>
              </Box>
            </Flex>
          </Box>

          <Box>
            <Flex justify="between" align="center" className="mb-2">
              <Text size="2" weight="bold" style={{ color: semanticColors.highContrastText }}>
                Radar Radius
              </Text>
              <Text size="2" weight="bold" style={{ color: semanticColors.accentText }}>
                {radiusMeters}m
              </Text>
            </Flex>
            <input
              type="range"
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(e.target.value)}
              min="100"
              max="5000"
              step="50"
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                background: `linear-gradient(to right, ${semanticColors.accentSolid} 0%, ${semanticColors.accentSolid} ${((parseInt(radiusMeters) - 100) / 4900) * 100}%, ${semanticColors.subtleBorder} ${((parseInt(radiusMeters) - 100) / 4900) * 100}%, ${semanticColors.subtleBorder} 100%)`,
                outline: 'none',
                cursor: 'pointer',
              }}
            />
            <Flex justify="between" className="mt-1">
              <Text size="1" style={{ color: semanticColors.lowContrastText }}>100m</Text>
              <Text size="1" style={{ color: semanticColors.lowContrastText }}>5000m</Text>
            </Flex>
          </Box>

          <Button
            size="3"
            onClick={handleSave}
            disabled={loading}
            style={{
              backgroundColor: semanticColors.accentSolid,
              color: semanticColors.highContrastText,
              cursor: 'pointer',
            }}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>

          {message && (
            <Text
              size="2"
              style={{
                color: message.includes('success') ? semanticColors.successText : semanticColors.dangerText,
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
