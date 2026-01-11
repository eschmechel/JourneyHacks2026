import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { friendsApi } from '../../src/services/api';
import { Friend, FriendRequest } from '../../src/types';

export default function FriendsScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [friendCode, setFriendCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        friendsApi.list(),
        friendsApi.getPendingRequests(),
      ]);
      setFriends(friendsRes.data.friends);
      setPendingRequests(requestsRes.data.requests);
    } catch (error) {
      console.error('Failed to load friends data:', error);
      Alert.alert('Error', 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!friendCode.trim()) {
      Alert.alert('Error', 'Please enter a friend code');
      return;
    }

    try {
      await friendsApi.sendRequest(friendCode.trim());
      Alert.alert('Success', 'Friend request sent!');
      setFriendCode('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendsApi.acceptRequest(requestId);
      Alert.alert('Success', 'Friend request accepted!');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await friendsApi.rejectRequest(requestId);
      Alert.alert('Success', 'Friend request rejected');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject request');
    }
  };

  const handleUnfriend = async (friendId: string) => {
    Alert.alert(
      'Unfriend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await friendsApi.unfriend(friendId);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.displayName}</Text>
        <Text style={styles.friendCode}>{item.friendCode}</Text>
      </View>
      <TouchableOpacity
        style={styles.unfriendButton}
        onPress={() => handleUnfriend(item.id)}
      >
        <Text style={styles.unfriendButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRequest = ({ item }: { item: FriendRequest }) => (
    <View style={styles.requestItem}>
      <View style={styles.requestInfo}>
        <Text style={styles.requestName}>{item.fromDisplayName}</Text>
        <Text style={styles.requestCode}>{item.fromFriendCode}</Text>
      </View>
      <View style={styles.requestButtons}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptRequest(item.id)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleRejectRequest(item.id)}
        >
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFB000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.addFriendSection}>
        <Text style={styles.sectionTitle}>Add Friend</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={friendCode}
            onChangeText={setFriendCode}
            placeholder="Enter friend code"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendRequest}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>

      {pendingRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Pending Requests ({pendingRequests.length})
          </Text>
          <FlatList
            data={pendingRequests}
            renderItem={renderRequest}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Friends ({friends.length})
        </Text>
        {friends.length === 0 ? (
          <Text style={styles.emptyText}>
            No friends yet. Add friends to see them on the map!
          </Text>
        ) : (
          <FlatList
            data={friends}
            renderItem={renderFriend}
            keyExtractor={(item) => item.id}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  addFriendSection: {
    backgroundColor: '#FFF',
    padding: 20,
    marginBottom: 10,
  },
  section: {
    backgroundColor: '#FFF',
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
  sendButton: {
    backgroundColor: '#FFB000',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  friendCode: {
    fontSize: 14,
    color: '#666',
  },
  unfriendButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  unfriendButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  requestItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  requestInfo: {
    marginBottom: 8,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  requestCode: {
    fontSize: 14,
    color: '#666',
  },
  requestButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#22C55E',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  rejectButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
