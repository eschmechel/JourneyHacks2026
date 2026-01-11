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
import { semanticColors } from '../lib/colors';

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
  mode?: string; // User's visibility mode
}

interface UserLocation {
  latitude: number;
  longitude: number;
  lastUpdated: string;
}

// Mock hardcoded friends data - Base: Vancouver Convention Centre
// Bob: FRIENDS mode - only visible to friends
// Charlie: EVERYONE mode - visible to all
// Dana: OFF mode - not visible to anyone
// Eve: EVERYONE mode - visible to all
// Frank: FRIENDS mode - only visible to friends

const ALL_MOCK_USERS: NearbyFriend[] = [
  {
    userId: 2,
    displayName: 'Bob',
    friendCode: 'TLPVAGUX',
    isFriend: true, // Alice's friend
    bearing: 45,
    distance: 150,
    distanceCategory: 'VERY_CLOSE',
    latitude: 49.2901,
    longitude: -123.1098,
    lastUpdated: new Date().toISOString(),
    mode: 'FRIENDS', // Only visible to friends
  },
  {
    userId: 3,
    displayName: 'Charlie',
    friendCode: 'DHWX4QMR',
    isFriend: true, // Alice's friend
    bearing: 135,
    distance: 450,
    distanceCategory: 'CLOSE',
    latitude: 49.2863,
    longitude: -123.1072,
    lastUpdated: new Date().toISOString(),
    mode: 'EVERYONE', // Visible to all
  },
  {
    userId: 4,
    displayName: 'Dana',
    friendCode: 'Y7PWTYGB',
    isFriend: true, // Alice's friend
    bearing: 270,
    distance: 850,
    distanceCategory: 'NEARBY',
    latitude: 49.2891,
    longitude: -123.1224,
    lastUpdated: new Date().toISOString(),
    mode: 'OFF', // Not visible to anyone
  },
  {
    userId: 5,
    displayName: 'Eve',
    friendCode: '594GPN4H',
    isFriend: false, // Not Alice's friend
    bearing: 315,
    distance: 300,
    distanceCategory: 'CLOSE',
    latitude: 49.2910,
    longitude: -123.1140,
    lastUpdated: new Date().toISOString(),
    mode: 'EVERYONE', // Visible to all
  },
  {
    userId: 6,
    displayName: 'Frank',
    friendCode: 'GF3DVJZD',
    isFriend: false, // Not Alice's friend
    bearing: 180,
    distance: 600,
    distanceCategory: 'NEARBY',
    latitude: 49.2837,
    longitude: -123.1112,
    lastUpdated: new Date().toISOString(),
    mode: 'FRIENDS', // Only visible to friends
  },
];

// Filter users based on visibility rules for Alice
const MOCK_FRIENDS: NearbyFriend[] = ALL_MOCK_USERS.filter(user => {
  if (user.mode === 'OFF') return false; // Dana is OFF, not visible
  if (user.mode === 'FRIENDS' && !user.isFriend) return false; // Frank is FRIENDS-only, Alice is not his friend
  return true; // Bob (friend), Charlie (everyone), Eve (everyone)
});

// Mock user location (Alice at base)
const MOCK_USER_LOCATION: UserLocation = {
  latitude: 49.2891,
  longitude: -123.1112,
  lastUpdated: new Date().toISOString(),
};

// Frank's mock data - positioned at 600m south of Alice
// Alice: EVERYONE mode - visible to all
// Bob: FRIENDS mode - Frank is not his friend, so NOT visible
// Charlie: EVERYONE mode - visible to all
// Dana: OFF mode - not visible to anyone
// Eve: EVERYONE mode - visible to all (and is Frank's friend)

const ALL_FRANK_MOCK_USERS: NearbyFriend[] = [
  {
    userId: 5,
    displayName: 'Eve',
    friendCode: '594GPN4H',
    isFriend: true, // Frank's friend
    bearing: 315,
    distance: 320,
    distanceCategory: 'CLOSE',
    latitude: 49.2910,
    longitude: -123.1140,
    lastUpdated: new Date().toISOString(),
    mode: 'EVERYONE',
  },
  {
    userId: 1,
    displayName: 'Alice',
    friendCode: 'NR6M9ZZV',
    isFriend: false, // Not Frank's friend
    bearing: 0,
    distance: 600,
    distanceCategory: 'NEARBY',
    latitude: 49.2891,
    longitude: -123.1112,
    lastUpdated: new Date().toISOString(),
    mode: 'EVERYONE',
  },
  {
    userId: 2,
    displayName: 'Bob',
    friendCode: 'TLPVAGUX',
    isFriend: false, // Not Frank's friend
    bearing: 45,
    distance: 750,
    distanceCategory: 'NEARBY',
    latitude: 49.2901,
    longitude: -123.1098,
    lastUpdated: new Date().toISOString(),
    mode: 'FRIENDS', // Only visible to friends
  },
  {
    userId: 3,
    displayName: 'Charlie',
    friendCode: 'DHWX4QMR',
    isFriend: false, // Not Frank's friend
    bearing: 135,
    distance: 550,
    distanceCategory: 'NEARBY',
    latitude: 49.2863,
    longitude: -123.1072,
    lastUpdated: new Date().toISOString(),
    mode: 'EVERYONE',
  },
  {
    userId: 4,
    displayName: 'Dana',
    friendCode: 'Y7PWTYGB',
    isFriend: false, // Not Frank's friend
    bearing: 270,
    distance: 900,
    distanceCategory: 'NEARBY',
    latitude: 49.2891,
    longitude: -123.1224,
    lastUpdated: new Date().toISOString(),
    mode: 'OFF', // Not visible to anyone
  },
];

// Filter users based on visibility rules for Frank
const FRANK_MOCK_FRIENDS: NearbyFriend[] = ALL_FRANK_MOCK_USERS.filter(user => {
  if (user.mode === 'OFF') return false; // Dana is OFF, not visible
  if (user.mode === 'FRIENDS' && !user.isFriend) return false; // Bob is FRIENDS-only, Frank is not his friend
  return true; // Eve (friend + everyone), Alice (everyone), Charlie (everyone)
});

const FRANK_MOCK_USER_LOCATION: UserLocation = {
  latitude: 49.2837, // 600m south of Alice
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
    const isAliceDemo = localStorage.getItem('deviceSecret') === '847bdc04-f607-4774-9646-5cd2318a2e83';
    const isFrankDemo = localStorage.getItem('deviceSecret') === 'e52bcb99-c0c1-4ebc-9491-9aebf442c1b4';
    
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
    } else if (isFrankDemo) {
      // Load friends list from localStorage
      const savedFriends = localStorage.getItem('frank-demo-friends');
      const defaultFriends = FRANK_MOCK_FRIENDS;
      const friendsList = savedFriends ? JSON.parse(savedFriends) : defaultFriends;
      
      // Filter FRANK_MOCK_FRIENDS to only include friends that are in the localStorage list
      const activeFriendIds = new Set(friendsList.map((f: any) => f.id));
      const filteredFriends = FRANK_MOCK_FRIENDS.filter(f => 
        !f.isFriend || activeFriendIds.has(f.userId)
      );
      
      // Use mock data for Frank
      setUserLocation(FRANK_MOCK_USER_LOCATION);
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
    const isAliceDemo = localStorage.getItem('deviceSecret') === '847bdc04-f607-4774-9646-5cd2318a2e83';
    const isFrankDemo = localStorage.getItem('deviceSecret') === 'e52bcb99-c0c1-4ebc-9491-9aebf442c1b4';
    
    if (isAliceDemo) {
      // Filter mock data based on scope
      if (scope === 'friends') {
        setNearby(MOCK_FRIENDS.filter(f => f.isFriend));
      } else {
        setNearby(MOCK_FRIENDS);
      }
    } else if (isFrankDemo) {
      // Filter Frank's mock data based on scope
      if (scope === 'friends') {
        setNearby(FRANK_MOCK_FRIENDS.filter(f => f.isFriend));
      } else {
        setNearby(FRANK_MOCK_FRIENDS);
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
    const isAliceDemo = localStorage.getItem('deviceSecret') === '847bdc04-f607-4774-9646-5cd2318a2e83';
    const isFrankDemo = localStorage.getItem('deviceSecret') === 'e52bcb99-c0c1-4ebc-9491-9aebf442c1b4';
    
    if (isAliceDemo || isFrankDemo) {
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
        return semanticColors.warningSolid;
      case 'CLOSE':
        return semanticColors.warningBgHover;
      case 'NEARBY':
        return semanticColors.warningBg;
      default:
        return semanticColors.accentBg;
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
          <Heading size="6" className="mb-1" style={{ color: semanticColors.accentText }}>
            {scope === 'friends' ? 'Nearby Friends' : 'Everyone Nearby'}
          </Heading>
          <Flex gap="2" align="center">
            <Text size="2" style={{ color: semanticColors.lowContrastText }}>
              Radius: {user?.radiusMeters}m
            </Text>
            {locationStatus === 'success' && lastUpdate && (
              <>
                <Text size="2" style={{ color: semanticColors.lowContrastText }}>•</Text>
                <Flex align="center" gap="1">
                  <CheckCircledIcon color="green" />
                  <Text size="2" style={{ color: semanticColors.lowContrastText }}>
                    Updated {formatRelativeTime(lastUpdate)}
                  </Text>
                </Flex>
              </>
            )}
            {locationStatus === 'updating' && (
              <>
                <Text size="2" style={{ color: semanticColors.lowContrastText }}>•</Text>
                <Text size="2" style={{ color: semanticColors.accentText }}>Updating...</Text>
              </>
            )}
            {locationStatus === 'error' && (
              <>
                <Text size="2" style={{ color: semanticColors.lowContrastText }}>•</Text>
                <Flex align="center" gap="1">
                  <CrossCircledIcon color="red" />
                  <Text size="2" style={{ color: semanticColors.dangerText }}>Failed</Text>
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
              backgroundColor: semanticColors.accentSolid,
              color: semanticColors.highContrastText,
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
              backgroundColor: viewMode === 'map' ? semanticColors.accentSolid : 'transparent',
              color: viewMode === 'map' ? semanticColors.highContrastText : semanticColors.accentText,
              borderColor: semanticColors.accentBorder,
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
              backgroundColor: viewMode === 'radar' ? semanticColors.accentSolid : 'transparent',
              color: viewMode === 'radar' ? semanticColors.highContrastText : semanticColors.accentText,
              borderColor: semanticColors.accentBorder,
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
              backgroundColor: viewMode === 'list' ? semanticColors.accentSolid : 'transparent',
              color: viewMode === 'list' ? semanticColors.highContrastText : semanticColors.accentText,
              borderColor: semanticColors.accentBorder,
              cursor: 'pointer',
            }}
            title="List View"
          >
            <ListBulletIcon />
          </Button>
        </Flex>
      </Flex>

      {error && (
        <Card className="p-4" style={{ backgroundColor: semanticColors.dangerBg, border: `1px solid ${semanticColors.dangerBorder}` }}>
          <Flex justify="between" align="center">
            <Text style={{ color: semanticColors.dangerText }}>{error}</Text>
            <Button
              size="1"
              onClick={handleManualRefresh}
              style={{ backgroundColor: semanticColors.accentSolid, color: semanticColors.highContrastText, cursor: 'pointer' }}
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
        <Card className="p-8 text-center" style={{ backgroundColor: semanticColors.componentBg, border: `2px solid ${semanticColors.accentBorder}` }}>
          <Text size="3" style={{ color: semanticColors.lowContrastText }}>
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
      {!loading && viewMode === 'map' && nearby.length > 0 && userLocation && (
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
            border: newAlerts.includes(friend.userId) ? `3px solid ${semanticColors.accentText}` : `2px solid ${semanticColors.accentSolid}`,
          }}
        >
          <Flex justify="between" align="center" className="p-3">
            <Box>
              <Flex gap="2" align="center" className="mb-1">
                <Text size="5" weight="bold" style={{ color: semanticColors.highContrastText }}>
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
                <Text size="2" style={{ color: semanticColors.lowContrastText }}>
                  {friend.friendCode}
                </Text>
              )}
            </Box>
            <Box style={{ textAlign: 'right' }}>
              <Text size="6" weight="bold" style={{ color: semanticColors.highContrastText }}>
                {friend.distance > (user?.radiusMeters || 1000) ? (
                  scope === 'friends' ? 'Out of Bounds' : '1000+'
                ) : `${friend.distance}`}m
              </Text>
              <Text size="2" style={{ color: semanticColors.lowContrastText }}>
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
