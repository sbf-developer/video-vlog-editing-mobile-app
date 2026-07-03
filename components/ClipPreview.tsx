import { ResizeMode, Video } from 'expo-av';
import { Image } from 'expo-image';
import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useThemeWithSpacing } from '@/hooks/useTheme';
import type { Clip } from '@/lib/types';

type ClipPreviewProps = {
  clip: Clip;
  autoPlay?: boolean;
};

export function ClipPreview({ clip, autoPlay = true }: ClipPreviewProps) {
  const { colors, radius } = useThemeWithSpacing();
  const videoRef = useRef<Video>(null);

  if (clip.type === 'image') {
    return (
      <View style={[styles.container, { borderRadius: radius.lg, backgroundColor: colors.surfaceSecondary }]}>
        <Image source={{ uri: clip.uri }} style={styles.media} contentFit="contain" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderRadius: radius.lg, backgroundColor: '#000' }]}>
      <Video
        ref={videoRef}
        source={{ uri: clip.uri }}
        style={styles.media}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={autoPlay}
        isLooping
        useNativeControls
        positionMillis={clip.trimStartMs}
      />
      {clip.textOverlays.map((overlay) => (
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
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 9 / 16,
    overflow: 'hidden',
    position: 'relative',
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
});
