import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { locationService } from '../services/location';

export default function SimulationControls() {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    checkSimulationStatus();
  }, []);

  const checkSimulationStatus = async () => {
    const active = await locationService.isSimulationActive();
    setIsActive(active);

    if (active) {
      const coords = await locationService.getCurrentLocation();
      setLatitude(coords.latitude.toString());
      setLongitude(coords.longitude.toString());
    }
  };

  const handleSave = async () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Invalid Input', 'Please enter valid latitude and longitude values');
      return;
    }

    if (lat < -90 || lat > 90) {
      Alert.alert('Invalid Latitude', 'Latitude must be between -90 and 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      Alert.alert('Invalid Longitude', 'Longitude must be between -180 and 180');
      return;
    }

    await locationService.setSimulatedLocation(lat, lng);
    setIsActive(true);
    Alert.alert('Success', 'Simulation mode enabled. Your location is now simulated.');
  };

  const handleClear = async () => {
    await locationService.clearSimulatedLocation();
    setLatitude('');
    setLongitude('');
    setIsActive(false);
    Alert.alert('Success', 'Simulation mode disabled. Using real GPS location.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location Simulation</Text>
      <Text style={styles.subtitle}>
        {isActive
          ? 'Simulation mode is active'
          : 'Enter coordinates to simulate your location'}
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Latitude</Text>
        <TextInput
          style={styles.input}
          value={latitude}
          onChangeText={setLatitude}
          placeholder="e.g., 37.7749"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Longitude</Text>
        <TextInput
          style={styles.input}
          value={longitude}
          onChangeText={setLongitude}
          placeholder="e.g., -122.4194"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>
            {isActive ? 'Update' : 'Enable'} Simulation
          </Text>
        </TouchableOpacity>

        {isActive && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Disable Simulation</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.hint}>
        💡 Example locations:{'\n'}
        San Francisco: 37.7749, -122.4194{'\n'}
        New York: 40.7128, -74.0060{'\n'}
        London: 51.5074, -0.1278
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
  buttonGroup: {
    marginTop: 20,
    gap: 12,
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
  clearButton: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFB000',
  },
  clearButtonText: {
    color: '#FFB000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hint: {
    marginTop: 20,
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
  },
});
