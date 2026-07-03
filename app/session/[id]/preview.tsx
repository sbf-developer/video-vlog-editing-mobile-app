import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState, type RefObject } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useVlog } from '@/context/VlogContext';
import { useThemeWithSpacing } from '@/hooks/useTheme';
import type { Clip } from '@/lib/types';

export default function PreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getSession } = useVlog();
  const { colors, spacing, typography } = useThemeWithSpacing();
  const session = getSession(id);
  const [index, setIndex] = useState(0);
  const videoRef = useRef<Video>(null);

  const clips = session?.clips ?? [];
  const current = clips[index];

  const goNext = useCallback(() => {
    if (index < clips.length - 1) setIndex((i) => i + 1);
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
          <ClipPlayer clip={current} videoRef={videoRef} onEnd={goNext} />
          {current.textOverlays.map((overlay) => (
            <Text
              key={overlay.id}
              style={[
                styles.overlayText,
                {
                  left: `${overlay.x * 100}%`,
                  top: `${overlay.y * 100}%`,
                  fontSize: overlay.fontSize,
                  color: overlay.color,
                },
              ]}>
              {overlay.text}
            </Text>
          ))}
        </View>

        <View style={[styles.bottomBar, { padding: spacing.md }]}>
          <Button
            label="Previous"
            variant="secondary"
            onPress={() => setIndex((i) => Math.max(0, i - 1))}
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

function ClipPlayer({
  clip,
  videoRef,
  onEnd,
}: {
  clip: Clip;
  videoRef: RefObject<Video | null>;
  onEnd: () => void;
}) {
  if (clip.type === 'image') {
    return (
      <Image
        source={{ uri: clip.uri }}
        style={styles.media}
        contentFit="contain"
        onLoad={() => setTimeout(onEnd, 3000)}
      />
    );
  }

  return (
    <Video
      ref={videoRef}
      source={{ uri: clip.uri }}
      style={styles.media}
      resizeMode={ResizeMode.CONTAIN}
      shouldPlay
      isLooping={false}
      onPlaybackStatusUpdate={(status) => {
        if (!status.isLoaded) return;
        const end = clip.trimEndMs || status.durationMillis || 0;
        if (status.positionMillis >= end - 100) {
          onEnd();
        }
      }}
      progressUpdateIntervalMillis={200}
    />
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
  media: {
    width: '100%',
    height: '100%',
  },
  overlayText: {
    position: 'absolute',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 10,
  },
});
