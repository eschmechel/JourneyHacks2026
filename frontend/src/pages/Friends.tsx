import { useEffect, useState } from 'react';
import { Box, Card, Text, Flex, Heading, TextField, Button } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import { friendsApi } from '../lib/api';

interface Friend {
  id: number;
  displayName: string | null;
  friendCode: string;
  mode: string;
  radiusMeters: number;
}

export function Friends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendCode, setFriendCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await friendsApi.list();
      setFriends(response.data.friends);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  };

  const handleAddFriend = async () => {
    if (!friendCode.trim()) return;

    setLoading(true);
    setMessage('');
    try {
      await friendsApi.acceptInvite(friendCode.toUpperCase().trim());
      setMessage('Friend added successfully!');
      setFriendCode('');
      await fetchFriends();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to add friend';
      setMessage(errorMsg);
    } finally {
      setLoading(false);
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
        </Text>
      </Box>

      {/* Add Friend Card */}
      <Card style={{ backgroundColor: '#FFF', border: '2px solid #FFD700' }}>
        <Flex direction="column" gap="3" p="4">
          <Text size="3" weight="bold" style={{ color: '#000' }}>
            Add Friend
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
              onClick={handleAddFriend}
              disabled={loading || !friendCode.trim()}
              style={{
                backgroundColor: '#FFD700',
                color: '#000',
                cursor: 'pointer',
              }}
            >
              <PlusIcon width="16" height="16" />
              Add
            </Button>
          </Flex>
          {message && (
            <Text
              size="2"
              style={{
                color: message.includes('success') ? '#00AA00' : '#CC0000',
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
                <Text size="4" weight="bold" mb="1" style={{ color: '#000' }}>
                  {friend.displayName || friend.friendCode}
                </Text>
                <Text size="2" style={{ color: '#666' }}>
                  {friend.friendCode}
                </Text>
              </Box>
              <Box style={{ textAlign: 'right' }}>
                <Text size="2" style={{ color: '#999' }}>
                  {friend.mode} • {friend.radiusMeters}m
                </Text>
              </Box>
            </Flex>
          </Card>
        ))
      )}
    </Flex>
  );
}
