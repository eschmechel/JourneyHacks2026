import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';

export default function RegisterScreen() {
  const { register, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    handleRegister();
  }, []);

  const handleRegister = async () => {
    try {
      await register();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Beepd</Text>
      <ActivityIndicator size="large" color="#FFB000" />
      <Text style={styles.subtitle}>Getting you started...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFB000',
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
});
