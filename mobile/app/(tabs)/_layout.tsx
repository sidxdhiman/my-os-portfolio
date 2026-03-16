import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, User } from 'lucide-react-native';
import { useOS } from '../../context/OSContext';
import { TouchableOpacity } from 'react-native';

export default function TabLayout() {
  const os = useOS();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6200ea',
        tabBarInactiveTintColor: '#8b90a8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e5ef',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#e2e5ef',
        },
        headerTitleStyle: {
          color: '#1a1d2e',
          fontWeight: '700',
          fontSize: 16,
        },
        headerRight: () => (
          <TouchableOpacity
            onPress={os.logout}
            style={{ marginRight: 16, padding: 8, backgroundColor: '#fff0f0', borderRadius: 8 }}
          >
            <User color="#d32f2f" size={18} />
          </TouchableOpacity>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}
