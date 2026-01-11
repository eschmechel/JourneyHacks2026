import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { settingsApi } from '../../src/services/api';
import SimulationControls from '../../src/components/SimulationControls';

export default function SettingsScreen() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [mode, setMode] = useState<'friends' | 'everyone'>('everyone');
  const [radiusMeters, setRadiusMeters] = useState('');
  const [showFriendsOnMap, setShowFriendsOnMap] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setMode(user.mode);
      setRadiusMeters(user.radiusMeters.toString());
      setShowFriendsOnMap(user.showFriendsOnMap);
    }
  }, [user]);

  const handleSave = async () => {
    const radius = parseInt(radiusMeters);
    if (isNaN(radius) || radius < 100 || radius > 50000) {
      Alert.alert('Invalid Radius', 'Radius must be between 100 and 50,000 meters');
      return;
    }

    if (!displayName.trim()) {
      Alert.alert('Invalid Name', 'Display name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const response = await settingsApi.update(
        displayName.trim(),
        mode,
        radius,
        showFriendsOnMap
      );
      refreshUser(response.data.user);
      Alert.alert('Success', 'Settings updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/register');
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFB000" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Friend Code</Text>
          <Text style={styles.friendCode}>{user.friendCode}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter display name"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visibility</Text>
        
        <View style={styles.radioGroup}>
          <Text style={styles.label}>Who can see me?</Text>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setMode('friends')}
          >
            <View style={styles.radio}>
              {mode === 'friends' && <View style={styles.radioSelected} />}
            </View>
            <Text style={styles.radioLabel}>Friends Only</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setMode('everyone')}
          >
            <View style={styles.radio}>
              {mode === 'everyone' && <View style={styles.radioSelected} />}
            </View>
            <Text style={styles.radioLabel}>Everyone</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.switchGroup}>
          <Text style={styles.label}>Show friends on map</Text>
          <Switch
            value={showFriendsOnMap}
            onValueChange={setShowFriendsOnMap}
            trackColor={{ false: '#DDD', true: '#FFB000' }}
            thumbColor="#FFF"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Range</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Radius (meters)</Text>
          <TextInput
            style={styles.input}
            value={radiusMeters}
            onChangeText={setRadiusMeters}
            placeholder="e.g., 5000"
            keyboardType="numeric"
          />
          <Text style={styles.hint}>
            How far away can others see you (100-50,000m)
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <SimulationControls />
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Settings</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  friendCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFB000',
  },
  inputGroup: {
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  radioGroup: {
    marginTop: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFB000',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFB000',
  },
  radioLabel: {
    fontSize: 16,
    color: '#000',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonGroup: {
    padding: 20,
    gap: 12,
    marginBottom: 40,
  },
  saveButton: {
    backgroundColor: '#FFB000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
