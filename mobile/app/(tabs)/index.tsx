import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { locationService } from '../../src/services/location';
import { nearbyApi, locationApi } from '../../src/services/api';
import MapViewComponent from '../../src/components/MapView';
import ClusterSheet from '../../src/components/ClusterSheet';
import { NearbyUser } from '../../src/types';

export default function HomeScreen() {
  const { user } = useAuth();
  const [scope, setScope] = useState<'friends' | 'everyone'>('everyone');
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetUsers, setSheetUsers] = useState<NearbyUser[]>([]);

  useEffect(() => {
    initializeLocation();
    const interval = setInterval(fetchNearbyUsers, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [scope]);

  const initializeLocation = async () => {
    try {
      const hasPermission = await locationService.hasPermission();
      if (!hasPermission) {
        const granted = await locationService.requestPermission();
        if (!granted) {
          Alert.alert(
            'Permission Required',
            'Beepd needs location permission to show nearby friends'
          );
          return;
        }
      }

      const coords = await locationService.getCurrentLocation();
      setUserLocation(coords);

      // Update backend with location
      await locationApi.update(coords.latitude, coords.longitude);
      await fetchNearbyUsers();
    } catch (error) {
      console.error('Location initialization failed:', error);
      Alert.alert('Error', 'Failed to get your location');
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyUsers = async () => {
    try {
      if (!userLocation) return;

      const response = await nearbyApi.get(scope);
      setNearbyUsers(response.data.nearby);
    } catch (error) {
      console.error('Failed to fetch nearby users:', error);
    }
  };

  const handleClusterPress = (users: NearbyUser[]) => {
    setSheetUsers(users);
    setSheetVisible(true);
  };

  const handleScopeToggle = (newScope: 'friends' | 'everyone') => {
    setScope(newScope);
    fetchNearbyUsers();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFB000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.scopeSelector}>
        <TouchableOpacity
          style={[
            styles.scopeButton,
            scope === 'friends' && styles.scopeButtonActive,
          ]}
          onPress={() => handleScopeToggle('friends')}
        >
          <Text
            style={[
              styles.scopeButtonText,
              scope === 'friends' && styles.scopeButtonTextActive,
            ]}
          >
            Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.scopeButton,
            scope === 'everyone' && styles.scopeButtonActive,
          ]}
          onPress={() => handleScopeToggle('everyone')}
        >
          <Text
            style={[
              styles.scopeButtonText,
              scope === 'everyone' && styles.scopeButtonTextActive,
            ]}
          >
            Everyone
          </Text>
        </TouchableOpacity>
      </View>

      <MapViewComponent
        userLocation={userLocation}
        nearbyUsers={nearbyUsers}
        onClusterPress={handleClusterPress}
      />

      <ClusterSheet
        visible={sheetVisible}
        users={sheetUsers}
        onClose={() => setSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  scopeSelector: {
    flexDirection: 'row',
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  scopeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  scopeButtonActive: {
    backgroundColor: '#FFB000',
  },
  scopeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  scopeButtonTextActive: {
    color: '#FFF',
  },
});
