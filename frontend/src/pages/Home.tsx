import { useEffect, useState } from 'react';
import { Box, Card, Text, Flex, Heading, Badge } from '@radix-ui/themes';
import { nearbyApi, locationApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface NearbyFriend {
  userId: number;
  displayName: string | null;
  friendCode: string;
  distance: number;
  distanceCategory: string;
  latitude: number;
  longitude: number;
  lastUpdated: string;
}

export function Home() {
  const { user } = useAuth();
  const [nearby, setNearby] = useState<NearbyFriend[]>([]);
  const [newAlerts, setNewAlerts] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState('');

  useEffect(() => {
    updateLocation();
    const interval = setInterval(updateLocation, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const updateLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setLocationStatus('Updating location...');
          await locationApi.update({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          setLocationStatus('Location updated');
          await fetchNearby();
        } catch (err) {
          console.error('Failed to update location:', err);
          setError('Failed to update location');
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Failed to get location');
      }
    );
  };

  const fetchNearby = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await nearbyApi.get();
      setNearby(response.data.nearby);
      setNewAlerts(response.data.newAlerts);
    } catch (err) {
      console.error('Failed to fetch nearby:', err);
      setError('Failed to fetch nearby friends');
    } finally {
      setLoading(false);
    }
  };

  const getDistanceColor = (category: string) => {
    switch (category) {
      case 'VERY_CLOSE':
        return '#FFD700';
      case 'CLOSE':
        return '#FFE55C';
      case 'NEARBY':
        return '#FFF4B8';
      default:
        return '#FFF9E0';
    }
  };

  return (
    <Flex direction="column" gap="4">
      <Box>
        <Heading size="6" mb="2" style={{ color: '#FFB000' }}>
          Nearby Friends
        </Heading>
        <Text size="2" style={{ color: '#666' }}>
          Radius: {user?.radiusMeters}m • {locationStatus}
        </Text>
      </Box>

      {error && (
        <Card style={{ backgroundColor: '#FFF0F0', border: '1px solid #FFB0B0' }}>
          <Text style={{ color: '#CC0000' }}>{error}</Text>
        </Card>
      )}

      {loading && (
        <Text style={{ color: '#666', textAlign: 'center' }}>Loading...</Text>
      )}

      {!loading && nearby.length === 0 && (
        <Card style={{ backgroundColor: '#FFF', border: '2px solid #FFE55C', padding: '2rem', textAlign: 'center' }}>
          <Text size="3" style={{ color: '#999' }}>
            No friends nearby right now
          </Text>
        </Card>
      )}

      {nearby.map((friend) => (
        <Card
          key={friend.userId}
          style={{
            backgroundColor: getDistanceColor(friend.distanceCategory),
            border: newAlerts.includes(friend.userId) ? '3px solid #FFB000' : '2px solid #FFD700',
          }}
        >
          <Flex justify="between" align="center" p="3">
            <Box>
              <Flex gap="2" align="center" mb="1">
                <Text size="5" weight="bold" style={{ color: '#000' }}>
                  {friend.displayName || friend.friendCode}
                </Text>
                {newAlerts.includes(friend.userId) && (
                  <Badge color="orange" size="1">
                    New
                  </Badge>
                )}
              </Flex>
              <Text size="2" style={{ color: '#666' }}>
                {friend.friendCode}
              </Text>
            </Box>
            <Box style={{ textAlign: 'right' }}>
              <Text size="6" weight="bold" style={{ color: '#000' }}>
                {friend.distance}m
              </Text>
              <Text size="2" style={{ color: '#666' }}>
                {friend.distanceCategory.replace('_', ' ')}
              </Text>
            </Box>
          </Flex>
        </Card>
      ))}
    </Flex>
  );
}
