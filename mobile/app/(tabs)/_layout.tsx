import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFB000',
        tabBarInactiveTintColor: '#999',
        headerStyle: {
          backgroundColor: '#FFF',
          borderBottomWidth: 2,
          borderBottomColor: '#FFD700',
        },
        headerTitleStyle: {
          color: '#FFB000',
          fontWeight: 'bold',
          fontSize: 20,
        },
        headerTitle: 'Beepd',
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopWidth: 2,
          borderTopColor: '#FFD700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarLabel: 'Friends',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>👥</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}
