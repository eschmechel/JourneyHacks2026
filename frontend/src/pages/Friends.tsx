import { useEffect, useState } from 'react';
import { Box, Card, Text, Flex, Heading, TextField, Button, Badge } from '@radix-ui/themes';
import { PlusIcon, Cross2Icon, CheckIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { friendsApi } from '../lib/api';

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
      const isAliceDemo = localStorage.getItem('deviceSecret') === 'alice-demo-secret-123';
      
      if (isAliceDemo) {
        // Load friends from localStorage or use defaults
        const savedFriends = localStorage.getItem('alice-demo-friends');
        const defaultFriends = [
          { id: 2, displayName: 'Bob', friendCode: 'BOB123', mode: 'FRIENDS', radiusMeters: 150 },
          { id: 3, displayName: 'Charlie', friendCode: 'CHARLIE', mode: 'FRIENDS', radiusMeters: 450 },
          { id: 4, displayName: 'Dana', friendCode: 'DANA456', mode: 'FRIENDS', radiusMeters: 850 },
        ];
        setFriends(savedFriends ? JSON.parse(savedFriends) : defaultFriends);
        
        // Save defaults if not saved yet
        if (!savedFriends) {
          localStorage.setItem('alice-demo-friends', JSON.stringify(defaultFriends));
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
      const isAliceDemo = localStorage.getItem('deviceSecret') === 'alice-demo-secret-123';
      
      if (isAliceDemo) {
        // For Alice demo, check if friend code matches available friends
        const availableFriends: { [key: string]: Friend } = {
          'BOB123': { id: 2, displayName: 'Bob', friendCode: 'BOB123', mode: 'FRIENDS', radiusMeters: 150 },
          'CHARLIE': { id: 3, displayName: 'Charlie', friendCode: 'CHARLIE', mode: 'FRIENDS', radiusMeters: 450 },
          'DANA456': { id: 4, displayName: 'Dana', friendCode: 'DANA456', mode: 'FRIENDS', radiusMeters: 850 },
          'EVE789': { id: 5, displayName: 'Eve', friendCode: 'EVE789', mode: 'EVERYONE', radiusMeters: 300 },
          'FRANK01': { id: 6, displayName: 'Frank', friendCode: 'FRANK01', mode: 'EVERYONE', radiusMeters: 600 },
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
        localStorage.setItem('alice-demo-friends', JSON.stringify(updatedFriends));
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
      const isAliceDemo = localStorage.getItem('deviceSecret') === 'alice-demo-secret-123';
      
      if (isAliceDemo) {
        // For Alice demo, remove from localStorage
        const updatedFriends = friends.filter(f => f.id !== friendId);
        localStorage.setItem('alice-demo-friends', JSON.stringify(updatedFriends));
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
        <Heading size="6" mb="2" style={{ color: '#FFB000' }}>
          Friends
        </Heading>
        <Text size="2" style={{ color: '#666' }}>
          {friends.length} friend{friends.length !== 1 ? 's' : ''}
          {pendingRequests.length > 0 && ` • ${pendingRequests.length} pending request${pendingRequests.length !== 1 ? 's' : ''}`}
        </Text>
      </Box>

      {/* Pending Friend Requests */}
      {pendingRequests.length > 0 && (
        <Card style={{ backgroundColor: '#FFF9E6', border: '2px solid #FFD700' }}>
          <Flex direction="column" gap="3" p="4">
            <Flex align="center" gap="2">
              <Heading size="4" style={{ color: '#000' }}>
                Pending Requests
              </Heading>
              <Badge color="orange">{pendingRequests.length}</Badge>
            </Flex>
            {pendingRequests.map((request) => (
              <Card key={request.id} style={{ backgroundColor: '#FFF', border: '1px solid #FFD700' }}>
                <Flex justify="between" align="center" p="3">
                  <Box>
                    <Text size="3" weight="bold" style={{ color: '#000' }}>
                      {request.displayName || request.friendCode}
                    </Text>
                    <Text size="2" style={{ color: '#666' }}>
                      {request.friendCode}
                    </Text>
                  </Box>
                  <Flex gap="2">
                    <Button
                      size="2"
                      onClick={() => handleAcceptRequest(request.id)}
                      style={{ backgroundColor: '#00CC00', color: '#FFF', cursor: 'pointer' }}
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
      <Card style={{ backgroundColor: '#FFF', border: '2px solid #FFD700' }}>
        <Flex direction="column" gap="3" p="4">
          <Text size="3" weight="bold" style={{ color: '#000' }}>
            Send Friend Request
          </Text>
          <Flex gap="2">
            <TextField.Root
              value={friendCode}
              onChange={(e) => setFriendCode(e.target.value)}
              placeholder="Enter friend code"
              size="3"
              style={{ flex: 1, backgroundColor: '#FFFEF0' }}
            />
            <Button
              size="3"
              onClick={handleSendRequest}
              disabled={loading || !friendCode.trim()}
              style={{
                backgroundColor: '#FFD700',
                color: '#000',
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
                color: message.includes('added') || message.includes('accepted') ? '#00AA00' : '#CC0000',
              }}
            >
              {message}
            </Text>
          )}
        </Flex>
      </Card>

      {/* Friends List */}
      {friends.length === 0 ? (
        <Card style={{ backgroundColor: '#FFF', border: '2px solid #FFE55C', padding: '2rem', textAlign: 'center' }}>
          <Text size="3" style={{ color: '#999' }}>
            No friends yet. Add friends using their friend code!
          </Text>
        </Card>
      ) : (
        friends.map((friend) => (
          <Card
            key={friend.id}
            style={{
              backgroundColor: '#FFF',
              border: '2px solid #FFD700',
            }}
          >
            <Flex justify="between" align="center" p="3">
              <Box>
                <Text size="4" weight="bold" style={{ color: '#000' }}>
                  {friend.displayName || friend.friendCode}
                </Text>
                <Text size="2" style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                  CODE# {friend.friendCode}
                </Text>
                <Text size="2" style={{ color: '#666', display: 'block', marginTop: '2px' }}>
                  Distance: {friend.radiusMeters}m
                </Text>
                <Text size="1" style={{ 
                  color: friend.mode === 'EVERYONE' ? '#00AA00' : friend.mode === 'FRIENDS' ? '#FF8800' : '#999',
                  fontWeight: 'bold',
                  marginTop: '4px',
                  display: 'block'
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
