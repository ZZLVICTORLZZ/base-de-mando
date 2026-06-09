import { Tabs } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#111827' },
        headerTintColor: '#fff',
        tabBarStyle: { backgroundColor: '#111827', borderTopColor: '#374151' },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Rol del Día',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tabla"
        options={{
          title: 'Tabla del Día',
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
        }}
      />
      <Tabs.Screen
        name="despacho"
        options={{
          title: 'Despacho',
          tabBarIcon: ({ color }) => <TabBarIcon name="rocket" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reportes"
        options={{
          title: 'Reportes',
          tabBarIcon: ({ color }) => <TabBarIcon name="warning" color={color} />,
        }}
      />
    </Tabs>
  );
}

// A simple icon placeholder since we haven't installed vector icons yet, 
// or we can just use text/emojis if vector-icons is not installed.
function TabBarIcon({ name, color }: { name: string; color: string }) {
  const iconMap: any = {
    'calendar': '📅',
    'list': '📋',
    'rocket': '🚀',
    'warning': '⚠️'
  };
  return <Text style={{ fontSize: 20, color }}>{iconMap[name]}</Text>;
}
