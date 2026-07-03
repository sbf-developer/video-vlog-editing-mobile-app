import { Stack } from 'expo-router';

export default function SessionIdLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="capture" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="preview" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="export" />
      <Stack.Screen name="edit/[clipId]" />
    </Stack>
  );
}
