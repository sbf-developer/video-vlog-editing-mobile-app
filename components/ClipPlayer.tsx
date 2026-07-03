import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { ResizeMode, Video, type AVPlaybackStatus } from 'expo-av';
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemeWithSpacing } from '@/hooks/useTheme';
import { formatDuration } from '@/lib/duration';
import type { Clip } from '@/lib/types';
import { getClipBounds } from '@/lib/videoMeta';

type ClipPlayerProps = {
  clip: Clip;
  autoPlay?: boolean;
  showControls?: boolean;
  onTimeUpdate?: (sourceMs: number) => void;
  onEnded?: () => void;
};

export function ClipPlayer({
  clip,
  autoPlay = false,
  showControls = true,
  onTimeUpdate,
  onEnded,
}: ClipPlayerProps) {
  const { colors, radius, typography } = useThemeWithSpacing();
  const videoRef = useRef<Video>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [positionMs, setPositionMs] = useState(0);
  const [loadedDurationMs, setLoadedDurationMs] = useState(clip.durationMs);
  const bounds = getClipBounds(clip);
  const trimStart = bounds.startMs;
  const trimEnd = bounds.endMs > 0 ? bounds.endMs : loadedDurationMs || clip.durationMs;
  const trimDuration = Math.max(0, trimEnd - trimStart);

  useEffect(() => {
    setPlaying(autoPlay);
    setPositionMs(trimStart);
    videoRef.current?.setPositionAsync(trimStart).catch(() => undefined);
  }, [clip.id, trimStart, autoPlay]);

  const handleStatus = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;

      if (status.durationMillis && status.durationMillis > 0) {
        setLoadedDurationMs(status.durationMillis);
      }

      const pos = status.positionMillis ?? trimStart;
      setPositionMs(pos);
      onTimeUpdate?.(pos);

      if (pos >= trimEnd - 80) {
        setPlaying(false);
        videoRef.current?.pauseAsync().catch(() => undefined);
        videoRef.current?.setPositionAsync(trimStart).catch(() => undefined);
        setPositionMs(trimStart);
        onEnded?.();
      }
    },
    [onEnded, onTimeUpdate, trimEnd, trimStart],
  );

  const togglePlay = async () => {
    if (clip.type !== 'video') return;
    if (playing) {
      await videoRef.current?.pauseAsync();
      setPlaying(false);
      return;
    }

    if (positionMs >= trimEnd - 80) {
      await videoRef.current?.setPositionAsync(trimStart);
      setPositionMs(trimStart);
    }
    await videoRef.current?.playAsync();
    setPlaying(true);
  };

  const seekTo = async (value: number) => {
    const next = Math.max(trimStart, Math.min(value, trimEnd));
    await videoRef.current?.setPositionAsync(next);
    setPositionMs(next);
    onTimeUpdate?.(next);
  };

  if (clip.type === 'image') {
    return (
      <View style={[styles.container, { borderRadius: radius.lg, backgroundColor: colors.surfaceSecondary }]}>
        <Image source={{ uri: clip.uri }} style={styles.media} contentFit="contain" />
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

  const relativeMs = Math.max(0, positionMs - trimStart);

  return (
    <View style={[styles.container, { borderRadius: radius.lg, backgroundColor: '#000' }]}>
      <Video
        ref={videoRef}
        source={{ uri: clip.uri }}
        style={styles.media}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={playing}
        isLooping={false}
        useNativeControls={false}
        progressUpdateIntervalMillis={100}
        onPlaybackStatusUpdate={handleStatus}
        onLoad={() => {
          videoRef.current?.setPositionAsync(trimStart).catch(() => undefined);
        }}
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

      {showControls ? (
        <View style={styles.controls}>
          <Pressable onPress={togglePlay} style={styles.playBtn} hitSlop={12}>
            <Ionicons name={playing ? 'pause' : 'play'} size={22} color="#fff" />
          </Pressable>
          <Text style={[typography.caption, styles.timeText]}>
            {formatDuration(relativeMs)} / {formatDuration(trimDuration)}
          </Text>
          <View style={styles.sliderWrap}>
            <Slider
              minimumValue={trimStart}
              maximumValue={Math.max(trimStart + 1, trimEnd)}
              value={Math.max(trimStart, Math.min(positionMs, trimEnd))}
              onSlidingComplete={seekTo}
              onValueChange={(v) => setPositionMs(v)}
              minimumTrackTintColor="#fff"
              maximumTrackTintColor="rgba(255,255,255,0.35)"
              thumbTintColor="#fff"
              {...(Platform.OS === 'web' ? { style: styles.webSlider } : {})}
            />
          </View>
        </View>
      ) : null}
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
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  timeText: {
    color: '#fff',
    minWidth: 56,
  },
  sliderWrap: {
    flex: 1,
  },
  webSlider: {
    width: '100%',
    height: 24,
  },
});
