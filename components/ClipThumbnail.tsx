import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemeWithSpacing } from '@/hooks/useTheme';
import type { Clip } from '@/lib/types';
import { formatDuration } from '@/lib/duration';

type ClipThumbnailProps = {
  clip: Clip;
  index: number;
  onPress?: () => void;
  onDelete?: () => void;
  selected?: boolean;
};

export function ClipThumbnail({ clip, index, onPress, onDelete, selected }: ClipThumbnailProps) {
  const { colors, radius, spacing, typography } = useThemeWithSpacing();
  const [thumbUri, setThumbUri] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadThumb() {
      if (clip.type === 'image') {
        setThumbUri(clip.uri);
        return;
      }
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(clip.uri, { time: clip.trimStartMs });
        if (mounted) setThumbUri(uri);
      } catch {
        if (mounted) setThumbUri(null);
      }
    }
    loadThumb();
    return () => {
      mounted = false;
    };
  }, [clip]);

  const duration =
    clip.type === 'image'
      ? '3s'
      : formatDuration(Math.max(0, clip.trimEndMs - clip.trimStartMs));

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrap,
        {
          borderRadius: radius.md,
          borderColor: selected ? colors.accent : colors.border,
          borderWidth: selected ? 2 : 1,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <View style={[styles.thumb, { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md }]}>
        {thumbUri ? (
          <Image source={{ uri: thumbUri }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons
              name={clip.type === 'video' ? 'videocam' : 'image'}
              size={28}
              color={colors.textMuted}
            />
          </View>
        )}
        <View style={[styles.badge, { backgroundColor: colors.overlay }]}>
          <Text style={[typography.caption, { color: '#fff' }]}>{index + 1}</Text>
        </View>
        <View style={[styles.duration, { backgroundColor: colors.overlay }]}>
          <Text style={[typography.caption, { color: '#fff' }]}>{duration}</Text>
        </View>
        {clip.textOverlays.length > 0 ? (
          <View style={[styles.textBadge, { backgroundColor: colors.accent }]}>
            <Ionicons name="text" size={12} color={colors.accentText} />
          </View>
        ) : null}
      </View>
      {onDelete ? (
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          style={[styles.deleteBtn, { backgroundColor: colors.danger, borderRadius: radius.full }]}>
          <Ionicons name="close" size={14} color="#fff" />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '48%',
    marginBottom: 12,
    position: 'relative',
  },
  thumb: {
    aspectRatio: 9 / 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  duration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  textBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
