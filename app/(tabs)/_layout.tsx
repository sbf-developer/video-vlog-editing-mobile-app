import { Tabs } from 'expo-router';

import { useThemeWithSpacing } from '@/hooks/useTheme';

export default function TabLayout() {
  const { colors } = useThemeWithSpacing();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
        tabBarActiveTintColor: colors.accent,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Vlogs' }} />
    </Tabs>
  );
}
