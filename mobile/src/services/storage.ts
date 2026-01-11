import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  DEVICE_SECRET: '@deviceSecret',
  USER: '@user',
  SIMULATED_LOCATION: '@simulatedLocation',
};

export const storage = {
  async getDeviceSecret(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.DEVICE_SECRET);
  },

  async setDeviceSecret(secret: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.DEVICE_SECRET, secret);
  },

  async removeDeviceSecret(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.DEVICE_SECRET);
  },

  async getUser(): Promise<any | null> {
    const user = await AsyncStorage.getItem(KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  async setUser(user: any): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.USER);
  },

  async getSimulatedLocation(): Promise<{ latitude: number; longitude: number } | null> {
    const location = await AsyncStorage.getItem(KEYS.SIMULATED_LOCATION);
    return location ? JSON.parse(location) : null;
  },

  async setSimulatedLocation(latitude: number, longitude: number): Promise<void> {
    await AsyncStorage.setItem(
      KEYS.SIMULATED_LOCATION,
      JSON.stringify({ latitude, longitude })
    );
  },

  async removeSimulatedLocation(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.SIMULATED_LOCATION);
  },

  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([KEYS.DEVICE_SECRET, KEYS.USER, KEYS.SIMULATED_LOCATION]);
  },
};
