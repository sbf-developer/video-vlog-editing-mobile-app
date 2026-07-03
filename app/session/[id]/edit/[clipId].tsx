import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';

import { ClipPreview } from '@/components/ClipPreview';
import { Button, Input } from '@/components/ui/Button';
import { useVlog } from '@/context/VlogContext';
import { useThemeWithSpacing } from '@/hooks/useTheme';
import type { TextOverlay } from '@/lib/types';
import { formatDuration } from '@/lib/duration';

export default function EditClipScreen() {
  const { id, clipId } = useLocalSearchParams<{ id: string; clipId: string }>();
  const { getSession, updateClip, removeClip, reorderClips } = useVlog();
  const { colors, spacing, typography } = useThemeWithSpacing();

  const session = getSession(id);
  const clip = session?.clips.find((c) => c.id === clipId);

  const [trimStart, setTrimStart] = useState(clip?.trimStartMs ?? 0);
  const [trimEnd, setTrimEnd] = useState(clip?.trimEndMs ?? 0);
  const [overlayText, setOverlayText] = useState('');
  const [overlays, setOverlays] = useState<TextOverlay[]>(clip?.textOverlays ?? []);

  const maxDuration = clip?.durationMs ?? 0;
  const isVideo = clip?.type === 'video';

  const trimmedDuration = useMemo(
    () => Math.max(0, trimEnd - trimStart),
    [trimEnd, trimStart],
  );

  if (!session || !clip) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, padding: 16 }}>Clip not found.</Text>
      </SafeAreaView>
    );
  }

  const clipIndex = session.clips.findIndex((c) => c.id === clipId);

  const moveClip = async (direction: 'up' | 'down') => {
    const ids = session.clips.map((c) => c.id);
    const target = direction === 'up' ? clipIndex - 1 : clipIndex + 1;
    if (target < 0 || target >= ids.length) return;
    [ids[clipIndex], ids[target]] = [ids[target], ids[clipIndex]];
    await reorderClips(session.id, ids);
  };

  const previewClip = { ...clip, trimStartMs: trimStart, trimEndMs: trimEnd, textOverlays: overlays };

  const saveChanges = async () => {
    await updateClip(session.id, clip.id, {
      trimStartMs: trimStart,
      trimEndMs: trimEnd,
      textOverlays: overlays,
    });
    router.back();
  };

  const addOverlay = () => {
    if (!overlayText.trim()) return;
    setOverlays([
      ...overlays,
      {
        id: uuidv4(),
        text: overlayText.trim(),
        x: 0.1,
        y: 0.1 + overlays.length * 0.08,
        fontSize: 24,
        color: '#FFFFFF',
      },
    ]);
    setOverlayText('');
  };

  const removeOverlay = (overlayId: string) => {
    setOverlays(overlays.filter((o) => o.id !== overlayId));
  };

  const deleteClip = () => {
    Alert.alert('Delete clip?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeClip(session.id, clip.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </Pressable>
          <Text style={[typography.heading, { color: colors.text }]}>Edit clip</Text>
          <Pressable onPress={saveChanges} hitSlop={12}>
            <Text style={[typography.body, { color: colors.success, fontWeight: '600' }]}>Save</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
          <ClipPreview clip={previewClip} autoPlay={false} />

          {isVideo ? (
            <View style={{ marginTop: spacing.lg }}>
              <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing.sm }]}>
                Trim · {formatDuration(trimmedDuration)}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Start</Text>
              <Slider
                minimumValue={0}
                maximumValue={Math.max(trimEnd - 500, 0)}
                step={100}
                value={trimStart}
                onValueChange={(v) => setTrimStart(Math.min(v, trimEnd - 500))}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.accent}
              />
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                End
              </Text>
              <Slider
                minimumValue={Math.min(trimStart + 500, maxDuration)}
                maximumValue={maxDuration}
                step={100}
                value={trimEnd}
                onValueChange={(v) => setTrimEnd(Math.max(v, trimStart + 500))}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.accent}
              />
            </View>
          ) : null}

          <View style={{ marginTop: spacing.lg }}>
            <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing.sm }]}>
              Text overlay
            </Text>
            <Input
              placeholder="Add caption text"
              value={overlayText}
              onChangeText={setOverlayText}
              onSubmitEditing={addOverlay}
            />
            <View style={{ marginTop: spacing.sm }}>
              <Button label="Add text" icon="text" variant="secondary" onPress={addOverlay} fullWidth />
            </View>
            {overlays.map((overlay) => (
              <View
                key={overlay.id}
                style={[
                  styles.overlayRow,
                  { backgroundColor: colors.surfaceSecondary, borderRadius: 8, marginTop: 8 },
                ]}>
                <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{overlay.text}</Text>
                <Pressable onPress={() => removeOverlay(overlay.id)}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </Pressable>
              </View>
            ))}
          </View>

          <View style={[styles.actionRow, { marginTop: spacing.lg, gap: 10 }]}>
            <Button
              label="Move earlier"
              icon="arrow-up"
              variant="secondary"
              onPress={() => moveClip('up')}
              disabled={clipIndex <= 0}
              style={{ flex: 1 }}
            />
            <Button
              label="Move later"
              icon="arrow-down"
              variant="secondary"
              onPress={() => moveClip('down')}
              disabled={clipIndex >= session.clips.length - 1}
              style={{ flex: 1 }}
            />
          </View>

          <View style={{ marginTop: spacing.xl }}>
            <Button label="Delete clip" variant="danger" icon="trash" onPress={deleteClip} fullWidth />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  overlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  actionRow: {
    flexDirection: 'row',
  },
});
