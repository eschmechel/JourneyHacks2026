import * as Location from 'expo-location';
import { storage } from './storage';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export const locationService = {
  /**
   * Get user's current location - checks for simulated location first,
   * then falls back to real device location
   */
  async getCurrentLocation(): Promise<LocationCoords> {
    // Check for simulated location first
    const simulated = await storage.getSimulatedLocation();
    if (simulated) {
      console.log('Using simulated location:', simulated);
      return simulated;
    }

    // Fall back to real location
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  },

  /**
   * Check if location permissions are granted
   */
  async hasPermission(): Promise<boolean> {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  },

  /**
   * Request location permissions
   */
  async requestPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  /**
   * Check if simulation mode is active
   */
  async isSimulationActive(): Promise<boolean> {
    const simulated = await storage.getSimulatedLocation();
    return simulated !== null;
  },

  /**
   * Enable simulation mode with specific coordinates
   */
  async setSimulatedLocation(latitude: number, longitude: number): Promise<void> {
    await storage.setSimulatedLocation(latitude, longitude);
  },

  /**
   * Disable simulation mode
   */
  async clearSimulatedLocation(): Promise<void> {
    await storage.removeSimulatedLocation();
  },
};
