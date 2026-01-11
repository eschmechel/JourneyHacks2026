import { useEffect, useState } from 'react';
import { Box, Card, Text, Flex, Heading, Badge, Button, Tabs } from '@radix-ui/themes';
import { ListBulletIcon, TargetIcon, ReloadIcon, CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { nearbyApi, locationApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { RadarView } from '../components/RadarView';
import { FriendListSkeleton, RadarSkeleton } from '../components/LoadingSkeletons';
import { formatRelativeTime } from '../utils/timeUtils';
import { MapView } from '../components/MapView';
import { ClusterSheet } from '../components/ClusterSheet';

interface NearbyFriend {
  userId: number;
  displayName: string | null;
  friendCode?: string;
  isFriend: boolean;
  bearing: number;
  distance: number;
  distanceCategory: string;
  latitude: number;
  longitude: number;
  lastUpdated: string | Date;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  lastUpdated: string;
}

// Mock hardcoded friends data - Base: Vancouver Convention Centre
const MOCK_FRIENDS: NearbyFriend[] = [
  {
    userId: 2,
    displayName: 'Bob',
    friendCode: 'TLPVAGUX', // Fixed credential from sample_users_credentials.txt
    isFriend: true,
    bearing: 0, // North
    distance: 150,
    distanceCategory: 'VERY_CLOSE',
    latitude: 49.2905, // 150m north
    longitude: -123.1112,
    lastUpdated: new Date().toISOString(),
  },
  {
    userId: 3,
    displayName: 'Charlie',
    friendCode: 'DHWX4QMR', // Fixed credential from sample_users_credentials.txt
    isFriend: true,
    bearing: 0, // North
    distance: 450,
    distanceCategory: 'CLOSE',
    latitude: 49.2932, // 450m north
    longitude: -123.1112,
    lastUpdated: new Date().toISOString(),
  },
  {
    userId: 4,
    displayName: 'Dana',
    friendCode: 'Y7PWTYGB', // Fixed credential from sample_users_credentials.txt
    isFriend: true,
    bearing: 0, // North
    distance: 850,
    distanceCategory: 'NEARBY',
    latitude: 49.2968, // 850m north
    longitude: -123.1112,
    lastUpdated: new Date().toISOString(),
  },
  {
    userId: 5,
    displayName: 'Eve',
    friendCode: '594GPN4H', // Fixed credential from sample_users_credentials.txt
    isFriend: false,
    bearing: 0, // North
    distance: 300,
    distanceCategory: 'CLOSE',
    latitude: 49.2918, // 300m north
    longitude: -123.1112,
    lastUpdated: new Date().toISOString(),
  },
  {
    userId: 6,
    displayName: 'Frank',
    friendCode: 'GF3DVJZD', // Fixed credential from sample_users_credentials.txt
    isFriend: false,
    bearing: 0, // North
    distance: 600,
    distanceCategory: 'NEARBY',
    latitude: 49.2945, // 600m north
    longitude: -123.1112,
    lastUpdated: new Date().toISOString(),
  },
];

// Mock user location (Alice at base)
const MOCK_USER_LOCATION: UserLocation = {
  latitude: 49.2891,
  longitude: -123.1112,
  lastUpdated: new Date().toISOString(),
};

export function Home() {
  const { user } = useAuth();
  const [scope, setScope] = useState<'friends' | 'everyone'>('friends');
  const [nearby, setNearby] = useState<NearbyFriend[]>([]);
  const [newAlerts, setNewAlerts] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'updating' | 'success' | 'error'>('idle');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'radar' | 'map'>('map');
  const [clusterMembers, setClusterMembers] = useState<NearbyFriend[]>([]);
  const [isClusterSheetOpen, setIsClusterSheetOpen] = useState(false);

  useEffect(() => {
    // Check if Alice demo mode
    const isAliceDemo = localStorage.getItem('deviceSecret') === 'alice-demo-secret-123';
    
    if (isAliceDemo) {
      // Load friends list from localStorage
      const savedFriends = localStorage.getItem('alice-demo-friends');
      const defaultFriends = MOCK_FRIENDS;
      const friendsList = savedFriends ? JSON.parse(savedFriends) : defaultFriends;
      
      // Filter MOCK_FRIENDS to only include friends that are in the localStorage list
      const activeFriendIds = new Set(friendsList.map((f: any) => f.id));
      const filteredFriends = MOCK_FRIENDS.filter(f => 
        !f.isFriend || activeFriendIds.has(f.userId)
      );
      
      // Use mock data for Alice
      setUserLocation(MOCK_USER_LOCATION);
      setNearby(filteredFriends);
      setLoading(false);
      setLocationStatus('success');
      setLastUpdate(new Date());
    } else {
      // Use real API for other users
      updateLocation();
      const interval = setInterval(updateLocation, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    const isAliceDemo = localStorage.getItem('deviceSecret') === 'alice-demo-secret-123';
    
    if (isAliceDemo) {
      // Filter mock data based on scope
      if (scope === 'friends') {
        setNearby(MOCK_FRIENDS.filter(f => f.isFriend));
      } else {
        setNearby(MOCK_FRIENDS);
      }
    } else {
      // Fetch real data
      if (userLocation) {
        fetchNearby();
      }
    }
  }, [scope]);

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
      const response = await nearbyApi.get({ scope });
      setNearby(response.data.nearby);
      setNewAlerts(response.data.newAlerts || []);
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
    const isAliceDemo = localStorage.getItem('deviceSecret') === 'alice-demo-secret-123';
    
    if (isAliceDemo) {
      // Just refresh timestamp for demo
      setRefreshing(true);
      setLastUpdate(new Date());
      setTimeout(() => {
        setRefreshing(false);
      }, 500);
    } else {
      // Real refresh
      updateLocation(true);
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
      {/* Scope Tabs */}
      <Tabs.Root value={scope} onValueChange={(value) => setScope(value as 'friends' | 'everyone')}>
        <Tabs.List>
          <Tabs.Trigger value="friends">Friends</Tabs.Trigger>
          <Tabs.Trigger value="everyone">Everyone</Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>

      <Flex justify="between" align="center">
        <Box>
          <Heading size="6" mb="1" style={{ color: '#FFB000' }}>
            {scope === 'friends' ? 'Nearby Friends' : 'Everyone Nearby'}
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
            variant={viewMode === 'map' ? 'solid' : 'outline'}
            size="2"
            onClick={() => setViewMode('map')}
            style={{
              backgroundColor: viewMode === 'map' ? '#FFD700' : 'transparent',
              color: viewMode === 'map' ? '#000' : '#FFB000',
              borderColor: '#FFD700',
              cursor: 'pointer',
            }}
            title="Map View"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.5 0C5.01 0 3 2.01 3 4.5C3 7.5 7.5 12 7.5 12C7.5 12 12 7.5 12 4.5C12 2.01 9.99 0 7.5 0ZM7.5 6C6.67 6 6 5.33 6 4.5C6 3.67 6.67 3 7.5 3C8.33 3 9 3.67 9 4.5C9 5.33 8.33 6 7.5 6Z" fill="currentColor"/>
            </svg>
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
            title="Radar View"
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
            title="List View"
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
      {loading && viewMode === 'map' && <RadarSkeleton />}
      {loading && viewMode === 'list' && <FriendListSkeleton />}

      {!loading && nearby.length === 0 && !error && (
        <Card style={{ backgroundColor: '#FFF', border: '2px solid #FFE55C', padding: '2rem', textAlign: 'center' }}>
          <Text size="3" style={{ color: '#999' }}>
            {scope === 'friends' ? 'No friends nearby right now' : 'No one nearby right now'}
          </Text>
        </Card>
      )}

      {/* Radar View */}
      {!loading && viewMode === 'radar' && nearby.length > 0 && (
        <RadarView
          nearby={nearby.filter(n => {
            const withinScope = scope === 'friends' ? n.isFriend : true;
            const withinRadius = n.distance <= (user?.radiusMeters || 1000);
            return withinScope && withinRadius;
          })}
          newAlerts={newAlerts}
          userRadius={user?.radiusMeters || 1000}
          userLocation={userLocation || undefined}
        />
      )}

      {/* Map View */}
      {!loading && viewMode === 'map' && userLocation && (
        <MapView
          nearby={nearby.filter(n => n.distance <= (user?.radiusMeters || 1000))}
          userLocation={userLocation}
          onClusterClick={(members) => {
            setClusterMembers(members);
            setIsClusterSheetOpen(true);
          }}
        />
      )}

      {/* Cluster Sheet */}
      <ClusterSheet
        isOpen={isClusterSheetOpen}
        members={clusterMembers}
        onClose={() => {
          setIsClusterSheetOpen(false);
          setClusterMembers([]);
        }}
      />

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
                  {friend.displayName || friend.friendCode || `User ${friend.userId}`}
                </Text>
                {friend.isFriend && (
                  <Badge color="green" size="1">
                    Friend
                  </Badge>
                )}
                {newAlerts.includes(friend.userId) && (
                  <Badge color="orange" size="1">
                    New
                  </Badge>
                )}
              </Flex>
              {friend.friendCode && (
                <Text size="2" style={{ color: '#666' }}>
                  {friend.friendCode}
                </Text>
              )}
            </Box>
            <Box style={{ textAlign: 'right' }}>
              <Text size="6" weight="bold" style={{ color: '#000' }}>
                {friend.distance > (user?.radiusMeters || 1000) ? (
                  scope === 'friends' ? 'Out of Bounds' : '1000+'
                ) : `${friend.distance}`}m
              </Text>
              <Text size="2" style={{ color: '#666' }}>
                {friend.distance > (user?.radiusMeters || 1000) 
                  ? (scope === 'friends' ? 'Outside Range' : 'FAR')
                  : friend.distanceCategory.replace('_', ' ')}
              </Text>
            </Box>
          </Flex>
        </Card>
      ))}
    </Flex>
  );
}
