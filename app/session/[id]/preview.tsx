import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { ClipPlayer } from '@/components/ClipPlayer';
import { Button } from '@/components/ui/Button';
import { useVlog } from '@/context/VlogContext';
import { useThemeWithSpacing } from '@/hooks/useTheme';

export default function PreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getSession } = useVlog();
  const { colors, spacing, typography } = useThemeWithSpacing();
  const session = getSession(id);
  const [index, setIndex] = useState(0);
  const [playKey, setPlayKey] = useState(0);

  const clips = session?.clips ?? [];
  const current = clips[index];

  const goNext = useCallback(() => {
    if (index < clips.length - 1) {
      setIndex((i) => i + 1);
      setPlayKey((k) => k + 1);
    }
  }, [index, clips.length]);

  if (!session || clips.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, padding: 16 }}>Nothing to preview.</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]}>
        <View style={[styles.topBar, { paddingHorizontal: spacing.md }]}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          <Text style={[typography.body, { color: '#fff' }]}>
            {index + 1} / {clips.length}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.player}>
          <ClipPlayer
            key={`${current.id}-${playKey}`}
            clip={current}
            autoPlay
            showControls={false}
            onEnded={goNext}
          />
        </View>

        <View style={[styles.bottomBar, { padding: spacing.md }]}>
          <Button
            label="Previous"
            variant="secondary"
            onPress={() => {
              setIndex((i) => Math.max(0, i - 1));
              setPlayKey((k) => k + 1);
            }}
            disabled={index === 0}
            style={{ flex: 1 }}
          />
          <Button
            label="Next"
            onPress={goNext}
            disabled={index >= clips.length - 1}
            style={{ flex: 1 }}
          />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  player: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 10,
  },
});
