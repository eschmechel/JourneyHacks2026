import { useEffect, useState } from 'react';
import { Box, Card, Text, Flex, Heading, Badge, Button, IconButton } from '@radix-ui/themes';
import { ListBulletIcon, TargetIcon, ReloadIcon, CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { nearbyApi, locationApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { RadarView } from '../components/RadarView';
import { FriendListSkeleton, RadarSkeleton } from '../components/LoadingSkeletons';
import { formatRelativeTime } from '../utils/timeUtils';

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

interface UserLocation {
  latitude: number;
  longitude: number;
  lastUpdated: string;
}

export function Home() {
  const { user } = useAuth();
  const [nearby, setNearby] = useState<NearbyFriend[]>([]);
  const [newAlerts, setNewAlerts] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'updating' | 'success' | 'error'>('idle');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'radar'>('radar');

  useEffect(() => {
    updateLocation();
    const interval = setInterval(updateLocation, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const updateLocation = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    }

    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLocationStatus('error');
      if (isManualRefresh) setRefreshing(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setLocationStatus('updating');
          setError(null);
          await locationApi.update({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          setLocationStatus('success');
          setLastUpdate(new Date());
          await fetchNearby();
        } catch (err) {
          console.error('Failed to update location:', err);
          setError('Failed to update location');
          setLocationStatus('error');
        } finally {
          if (isManualRefresh) setRefreshing(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Failed to get location');
        setLocationStatus('error');
        if (isManualRefresh) setRefreshing(false);
      }
    );
  };

  const fetchNearby = async () => {
    if (!refreshing) {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await nearbyApi.get();
      setNearby(response.data.nearby);
      setNewAlerts(response.data.newAlerts);
      if (response.data.userLocation) {
        setUserLocation({
          latitude: response.data.userLocation.latitude,
          longitude: response.data.userLocation.longitude,
          lastUpdated: response.data.userLocation.lastUpdated,
        });
      }
    } catch (err) {
      console.error('Failed to fetch nearby:', err);
      setError('Failed to fetch nearby friends');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = () => {
    updateLocation(true);
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
      <Flex justify="between" align="center">
        <Box>
          <Heading size="6" mb="1" style={{ color: '#FFB000' }}>
            Nearby Friends
          </Heading>
          <Flex gap="2" align="center">
            <Text size="2" style={{ color: '#666' }}>
              Radius: {user?.radiusMeters}m
            </Text>
            {locationStatus === 'success' && lastUpdate && (
              <>
                <Text size="2" style={{ color: '#999' }}>•</Text>
                <Flex align="center" gap="1">
                  <CheckCircledIcon color="green" />
                  <Text size="2" style={{ color: '#666' }}>
                    Updated {formatRelativeTime(lastUpdate)}
                  </Text>
                </Flex>
              </>
            )}
            {locationStatus === 'updating' && (
              <>
                <Text size="2" style={{ color: '#999' }}>•</Text>
                <Text size="2" style={{ color: '#FFB000' }}>Updating...</Text>
              </>
            )}
            {locationStatus === 'error' && (
              <>
                <Text size="2" style={{ color: '#999' }}>•</Text>
                <Flex align="center" gap="1">
                  <CrossCircledIcon color="red" />
                  <Text size="2" style={{ color: '#CC0000' }}>Failed</Text>
                </Flex>
              </>
            )}
          </Flex>
        </Box>

        {/* View Toggle + Refresh */}
        <Flex gap="2">
          <Button
            size="2"
            onClick={handleManualRefresh}
            disabled={refreshing || locationStatus === 'updating'}
            style={{
              backgroundColor: '#FFD700',
              color: '#000',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            <ReloadIcon style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </Button>
          <Button
            variant={viewMode === 'radar' ? 'solid' : 'outline'}
            size="2"
            onClick={() => setViewMode('radar')}
            style={{
              backgroundColor: viewMode === 'radar' ? '#FFD700' : 'transparent',
              color: viewMode === 'radar' ? '#000' : '#FFB000',
              borderColor: '#FFD700',
              cursor: 'pointer',
            }}
          >
            <TargetIcon />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'solid' : 'outline'}
            size="2"
            onClick={() => setViewMode('list')}
            style={{
              backgroundColor: viewMode === 'list' ? '#FFD700' : 'transparent',
              color: viewMode === 'list' ? '#000' : '#FFB000',
              borderColor: '#FFD700',
              cursor: 'pointer',
            }}
          >
            <ListBulletIcon />
          </Button>
        </Flex>
      </Flex>

      {error && (
        <Card style={{ backgroundColor: '#FFF0F0', border: '1px solid #FFB0B0', padding: '1rem' }}>
          <Flex justify="between" align="center">
            <Text style={{ color: '#CC0000' }}>{error}</Text>
            <Button
              size="1"
              onClick={handleManualRefresh}
              style={{ backgroundColor: '#FFD700', color: '#000', cursor: 'pointer' }}
            >
              Retry
            </Button>
          </Flex>
        </Card>
      )}

      {loading && viewMode === 'radar' && <RadarSkeleton />}
      {loading && viewMode === 'list' && <FriendListSkeleton />}

      {!loading && nearby.length === 0 && !error && (
        <Card style={{ backgroundColor: '#FFF', border: '2px solid #FFE55C', padding: '2rem', textAlign: 'center' }}>
          <Text size="3" style={{ color: '#999' }}>
            No friends nearby right now
          </Text>
        </Card>
      )}

      {/* Radar View */}
      {!loading && viewMode === 'radar' && nearby.length > 0 && (
        <RadarView
          nearby={nearby}
          newAlerts={newAlerts}
          userRadius={user?.radiusMeters || 1000}
          userLocation={userLocation || undefined}
        />
      )}

      {/* List View */}
      {!loading && viewMode === 'list' && nearby.map((friend) => (
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
