import { useEffect, useState } from 'react';
import { Box, Card, Text, Flex, Heading, TextField, Button, Badge } from '@radix-ui/themes';
import { PlusIcon, Cross2Icon, CheckIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { friendsApi } from '../lib/api';
import { semanticColors } from '../lib/colors';

interface Friend {
  id: number;
  displayName: string | null;
  friendCode: string;
  mode: string;
  radiusMeters: number;
}

interface FriendRequest {
  id: number;
  fromUserId: number;
  displayName: string | null;
  friendCode: string;
  createdAt: Date;
}

export function Friends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [friendCode, setFriendCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchFriends();
    fetchPendingRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const isAliceDemo = localStorage.getItem('deviceSecret') === '847bdc04-f607-4774-9646-5cd2318a2e83';
      const isFrankDemo = localStorage.getItem('deviceSecret') === 'e52bcb99-c0c1-4ebc-9491-9aebf442c1b4';
      
      if (isAliceDemo) {
        // Load friends from localStorage or use defaults
        const savedFriends = localStorage.getItem('alice-demo-friends');
        const defaultFriends = [
          { id: 2, displayName: 'Bob', friendCode: 'TLPVAGUX', mode: 'FRIENDS', radiusMeters: 150 },
          { id: 3, displayName: 'Charlie', friendCode: 'DHWX4QMR', mode: 'FRIENDS', radiusMeters: 450 },
          { id: 4, displayName: 'Dana', friendCode: 'Y7PWTYGB', mode: 'FRIENDS', radiusMeters: 850 },
        ];
        setFriends(savedFriends ? JSON.parse(savedFriends) : defaultFriends);
        
        // Save defaults if not saved yet
        if (!savedFriends) {
          localStorage.setItem('alice-demo-friends', JSON.stringify(defaultFriends));
        }
        return;
      }
      
      if (isFrankDemo) {
        // Load Frank's friends from localStorage or use defaults
        const savedFriends = localStorage.getItem('frank-demo-friends');
        const defaultFriends = [
          { id: 5, displayName: 'Eve', friendCode: '594GPN4H', mode: 'EVERYONE', radiusMeters: 320 },
        ];
        setFriends(savedFriends ? JSON.parse(savedFriends) : defaultFriends);
        
        // Save defaults if not saved yet
        if (!savedFriends) {
          localStorage.setItem('frank-demo-friends', JSON.stringify(defaultFriends));
        }
        return;
      }
      
      const response = await friendsApi.list();
      setFriends(response.data.friends);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await friendsApi.getPendingRequests();
      setPendingRequests(response.data.requests);
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
    }
  };

  const handleSendRequest = async () => {
    if (!friendCode.trim()) return;

    setLoading(true);
    setMessage('');
    try {
      const isAliceDemo = localStorage.getItem('deviceSecret') === '847bdc04-f607-4774-9646-5cd2318a2e83';
      const isFrankDemo = localStorage.getItem('deviceSecret') === 'e52bcb99-c0c1-4ebc-9491-9aebf442c1b4';
      
      if (isAliceDemo || isFrankDemo) {
        const storageKey = isAliceDemo ? 'alice-demo-friends' : 'frank-demo-friends';
        // For demo, check if friend code matches available friends
        const availableFriends: { [key: string]: Friend } = {
          'TLPVAGUX': { id: 2, displayName: 'Bob', friendCode: 'TLPVAGUX', mode: 'FRIENDS', radiusMeters: 150 },
          'DHWX4QMR': { id: 3, displayName: 'Charlie', friendCode: 'DHWX4QMR', mode: 'FRIENDS', radiusMeters: 450 },
          'Y7PWTYGB': { id: 4, displayName: 'Dana', friendCode: 'Y7PWTYGB', mode: 'FRIENDS', radiusMeters: 850 },
          '594GPN4H': { id: 5, displayName: 'Eve', friendCode: '594GPN4H', mode: 'EVERYONE', radiusMeters: 300 },
          'GF3DVJZD': { id: 6, displayName: 'Frank', friendCode: 'GF3DVJZD', mode: 'EVERYONE', radiusMeters: 600 },
          'NR6M9ZZV': { id: 1, displayName: 'Alice', friendCode: 'NR6M9ZZV', mode: 'EVERYONE', radiusMeters: 1000 },
        };
        
        const code = friendCode.toUpperCase().trim();
        const friendToAdd = availableFriends[code];
        
        if (!friendToAdd) {
          setMessage('Friend code not found');
          setLoading(false);
          return;
        }
        
        // Check if already friends
        if (friends.find(f => f.id === friendToAdd.id)) {
          setMessage('Already friends with this user');
          setLoading(false);
          return;
        }
        
        // Add friend
        const updatedFriends = [...friends, friendToAdd];
        localStorage.setItem(storageKey, JSON.stringify(updatedFriends));
        setFriends(updatedFriends);
        setMessage('Friend added!');
        setFriendCode('');
        setLoading(false);
        return;
      }
      
      await friendsApi.sendRequest(friendCode.toUpperCase().trim());
      setMessage('Friend request sent!');
      setFriendCode('');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to send request';
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await friendsApi.acceptRequest(requestId);
      await fetchFriends();
      await fetchPendingRequests();
      setMessage('Friend request accepted!');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to accept request';
      setMessage(errorMsg);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      await friendsApi.rejectRequest(requestId);
      await fetchPendingRequests();
      setMessage('Friend request rejected');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to reject request';
      setMessage(errorMsg);
    }
  };

  const handleUnfriend = async (friendId: number, friendName: string) => {
    if (!confirm(`Are you sure you want to remove ${friendName} from your friends?`)) {
      return;
    }

    try {
      const isAliceDemo = localStorage.getItem('deviceSecret') === '051e0705-7daf-414d-98fb-f28f52a719db';
      const isFrankDemo = localStorage.getItem('deviceSecret') === 'e52bcb99-c0c1-4ebc-9491-9aebf442c1b4';
      
      if (isAliceDemo || isFrankDemo) {
        const storageKey = isAliceDemo ? 'alice-demo-friends' : 'frank-demo-friends';
        // For demo, remove from localStorage
        const updatedFriends = friends.filter(f => f.id !== friendId);
        localStorage.setItem(storageKey, JSON.stringify(updatedFriends));
        setFriends(updatedFriends);
        setMessage(`${friendName} removed (Demo mode)`);
        return;
      }
      
      await friendsApi.unfriend(friendId);
      await fetchFriends();
      setMessage('Friend removed');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to remove friend';
      setMessage(errorMsg);
    }
  };

  return (
    <Flex direction="column" gap="4">
      <Box>
        <Heading size="6" className="mb-2" style={{ color: semanticColors.accentText }}>
          Friends
        </Heading>
        <Text size="2" style={{ color: semanticColors.lowContrastText }}>
          {friends.length} friend{friends.length !== 1 ? 's' : ''}
          {pendingRequests.length > 0 && ` • ${pendingRequests.length} pending request${pendingRequests.length !== 1 ? 's' : ''}`}
        </Text>
      </Box>

      {/* Pending Friend Requests */}
      {pendingRequests.length > 0 && (
        <Card style={{ backgroundColor: semanticColors.accentBg, border: `2px solid ${semanticColors.accentSolid}` }}>
          <Flex direction="column" gap="3" className="p-3">
            <Flex align="center" gap="2">
              <Heading size="4" style={{ color: semanticColors.highContrastText }}>
                Pending Requests
              </Heading>
              <Badge color="orange">{pendingRequests.length}</Badge>
            </Flex>
            {pendingRequests.map((request) => (
              <Card key={request.id} style={{ backgroundColor: semanticColors.componentBg, border: `1px solid ${semanticColors.accentBorder}` }}>
                <Flex justify="between" align="center" className="p-2">
                  <Box>
                    <Text size="3" weight="bold" style={{ color: semanticColors.highContrastText }}>
                      {request.displayName || 'Anonymous'}
                    </Text>
                    <Text size="2" style={{ color: semanticColors.lowContrastText }}>
                      {request.friendCode}
                    </Text>
                  </Box>
                  <Flex gap="2">
                    <Button
                      size="2"
                      onClick={() => handleAcceptRequest(request.id)}
                      style={{ backgroundColor: semanticColors.successSolid, color: semanticColors.componentBg, cursor: 'pointer' }}
                    >
                      <CheckIcon />
                      Accept
                    </Button>
                    <Button
                      size="2"
                      variant="soft"
                      color="red"
                      onClick={() => handleRejectRequest(request.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Cross2Icon />
                      Reject
                    </Button>
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Flex>
        </Card>
      )}

      {/* Add Friend Card */}
      <Card style={{ backgroundColor: semanticColors.componentBg, border: `2px solid ${semanticColors.accentSolid}` }}>
        <Flex direction="column" gap="3" p="3">
          <Text size="3" weight="bold" style={{ color: semanticColors.highContrastText }}>
            Send Friend Request
          </Text>
          <Flex gap="2">
            <TextField.Root
              value={friendCode}
              onChange={(e) => setFriendCode(e.target.value)}
              placeholder="Enter friend code"
              size="3"
              style={{ flex: 1, backgroundColor: semanticColors.subtleBg }}
            />
            <Button
              size="3"
              onClick={handleSendRequest}
              disabled={loading || !friendCode.trim()}
              style={{
                backgroundColor: semanticColors.accentSolid,
                color: semanticColors.highContrastText,
                cursor: 'pointer',
              }}
            >
              <PlusIcon width="16" height="16" />
              Send Request
            </Button>
          </Flex>
          {message && (
            <Text
              size="2"
              style={{
                color: message.includes('added') || message.includes('accepted') ? semanticColors.successText : semanticColors.dangerText,
              }}
            >
              {message}
            </Text>
          )}
        </Flex>
      </Card>

      {/* Friends List */}
      {friends.length === 0 ? (
        <Card className="p-8 text-center" style={{ backgroundColor: semanticColors.componentBg, border: `2px solid ${semanticColors.accentBorder}` }}>
          <Text size="3" style={{ color: semanticColors.lowContrastText }}>
            No friends yet. Add friends using their friend code!
          </Text>
        </Card>
      ) : (
        friends.map((friend) => (
          <Card
            key={friend.id}
            style={{
              backgroundColor: semanticColors.componentBg,
              border: `2px solid ${semanticColors.accentSolid}`,
            }}
          >
            <Flex justify="between" align="center" className="p-3">
              <Box>
                <Text size="4" weight="bold" style={{ color: semanticColors.highContrastText }}>
                  {friend.displayName || friend.friendCode}
                </Text>
                <Text size="2" className="block mt-1" style={{ color: semanticColors.lowContrastText }}>
                  CODE# {friend.friendCode}
                </Text>
                <Text size="2" className="block mt-0.5" style={{ color: semanticColors.lowContrastText }}>
                  Distance: {friend.radiusMeters}m
                </Text>
                <Text size="1" className="block mt-1 font-bold" style={{ 
                  color: friend.mode === 'EVERYONE' ? semanticColors.successText : friend.mode === 'FRIENDS' ? semanticColors.warningText : semanticColors.lowContrastText
                }}>
                  {friend.mode === 'EVERYONE' ? '🟢 Everyone Mode' : 
                   friend.mode === 'FRIENDS' ? '🟡 Friends Only' : 
                   '⚫ Off'}
                </Text>
              </Box>
              <Button
                size="2"
                variant="soft"
                color="red"
                onClick={() => handleUnfriend(friend.id, friend.displayName || friend.friendCode)}
                style={{ cursor: 'pointer' }}
              >
                <CrossCircledIcon />
                Remove
              </Button>
            </Flex>
          </Card>
        ))
      )}
    </Flex>
  );
}
