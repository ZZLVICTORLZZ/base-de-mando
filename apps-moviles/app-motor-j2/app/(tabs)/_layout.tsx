import { Tabs } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#f8fafc',
        tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#334155' },
        tabBarActiveTintColor: '#38bdf8',
        tabBarInactiveTintColor: '#64748b',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="rd"
        options={{
          title: 'Rol Despegue',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="otp"
        options={{
          title: 'Proyección',
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ctr"
        options={{
          title: 'Tiempo Real',
          tabBarIcon: ({ color }) => <TabBarIcon name="rocket" color={color} />,
        }}
      />
    </Tabs>
  );
}

// Placeholder
function TabBarIcon({ name, color }: { name: string; color: string }) {
  const iconMap: any = {
    'home': '🏠',
    'calendar': '📅',
    'list': '📋',
    'rocket': '🚀'
  };
  return <Text style={{ fontSize: 20, color }}>{iconMap[name]}</Text>;
}
