import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ClipPreview } from '@/components/ClipPreview';
import { Button } from '@/components/ui/Button';
import { useThemeWithSpacing } from '@/hooks/useTheme';
import { confirmAction } from '@/lib/confirm';
import { formatDuration, getClipDurationMs, getTotalDurationMs } from '@/lib/duration';
import type { AudioTrack, Clip, VlogSession } from '@/lib/types';

const PX_PER_SEC = 32;
const MIN_CLIP_WIDTH = 64;
const TRACK_HEIGHT = 72;
const GAP = 6;

type TimelineEditorProps = {
  session: VlogSession;
  onEditClip: (clipId: string) => void;
  onDeleteClip: (clipId: string) => void;
  onReorderClips: (clipIds: string[]) => void;
  onDeleteAudio: (trackId: string) => void;
  onAddAudio: () => void;
  onRecord: () => void;
  onImport: () => void;
  onPreview: () => void;
  onExport: () => void;
};

function clipWidth(clip: Clip): number {
  return Math.max(MIN_CLIP_WIDTH, (getClipDurationMs(clip) / 1000) * PX_PER_SEC);
}

function audioWidth(track: AudioTrack): number {
  return Math.max(MIN_CLIP_WIDTH, (track.durationMs / 1000) * PX_PER_SEC);
}

export function TimelineEditor({
  session,
  onEditClip,
  onDeleteClip,
  onReorderClips,
  onDeleteAudio,
  onAddAudio,
  onRecord,
  onImport,
  onPreview,
  onExport,
}: TimelineEditorProps) {
  const { colors, spacing, typography, radius } = useThemeWithSpacing();
  const [selectedClipId, setSelectedClipId] = useState<string | null>(session.clips[0]?.id ?? null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const layoutsRef = useRef<{ id: string; x: number; width: number }[]>([]);

  const selectedClip = session.clips.find((c) => c.id === selectedClipId) ?? session.clips[0] ?? null;
  const totalMs = getTotalDurationMs(session.clips);

  const layouts = useMemo(() => {
    let x = 0;
    return session.clips.map((clip) => {
      const width = clipWidth(clip);
      const layout = { id: clip.id, x, width };
      x += width + GAP;
      return layout;
    });
  }, [session.clips]);

  layoutsRef.current = layouts;

  const handleDeleteClip = async (clipId: string) => {
    const ok = await confirmAction('Remove clip?', 'This clip will be deleted from the session.');
    if (ok) onDeleteClip(clipId);
  };

  const handleDeleteAudio = async (trackId: string) => {
    const ok = await confirmAction('Remove audio?', 'This audio track will be removed.');
    if (ok) onDeleteAudio(trackId);
  };

  const reorderByIndex = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= session.clips.length) return;
    const ids = session.clips.map((c) => c.id);
    const [moved] = ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, moved);
    onReorderClips(ids);
  };

  const indexAtOffset = (offsetX: number): number => {
    for (let i = 0; i < layoutsRef.current.length; i++) {
      const layout = layoutsRef.current[i];
      if (offsetX < layout.x + layout.width / 2) return i;
    }
    return Math.max(0, layoutsRef.current.length - 1);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.previewWrap, { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md }]}>
        {selectedClip ? (
          <ClipPreview clip={selectedClip} autoPlay={false} />
        ) : (
          <View style={styles.previewEmpty}>
            <Ionicons name="film-outline" size={40} color={colors.textMuted} />
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: 8 }]}>
              Add clips to start editing
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.ruler, { borderColor: colors.border }]}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>0:00</Text>
        <View style={[styles.rulerLine, { backgroundColor: colors.border }]} />
        <Text style={[typography.caption, { color: colors.textMuted }]}>{formatDuration(totalMs)}</Text>
      </View>

      <Text style={[typography.label, { color: colors.textMuted, marginBottom: 6, paddingHorizontal: spacing.md }]}>
        Video
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.trackContent, { paddingHorizontal: spacing.md }]}>
        {session.clips.length === 0 ? (
          <View style={[styles.emptyTrack, { borderColor: colors.border, borderRadius: radius.md }]}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Record or import clips
            </Text>
          </View>
        ) : (
          session.clips.map((clip, index) => (
            <TimelineClipBlock
              key={clip.id}
              clip={clip}
              index={index}
              width={clipWidth(clip)}
              selected={selectedClipId === clip.id}
              isDragging={draggingId === clip.id}
              isDropTarget={dragOverIndex === index && draggingId !== clip.id}
              onSelect={() => setSelectedClipId(clip.id)}
              onEdit={() => onEditClip(clip.id)}
              onDelete={() => handleDeleteClip(clip.id)}
              onDragStart={() => setDraggingId(clip.id)}
              onDragMove={(dx) => {
                const fromIndex = session.clips.findIndex((c) => c.id === clip.id);
                const layout = layoutsRef.current[fromIndex];
                if (!layout) return;
                const target = indexAtOffset(layout.x + dx + layout.width / 2);
                setDragOverIndex(target);
              }}
              onDragEnd={(dx) => {
                const fromIndex = session.clips.findIndex((c) => c.id === clip.id);
                const layout = layoutsRef.current[fromIndex];
                const toIndex = layout ? indexAtOffset(layout.x + dx + layout.width / 2) : fromIndex;
                reorderByIndex(fromIndex, toIndex);
                setDraggingId(null);
                setDragOverIndex(null);
              }}
            />
          ))
        )}
      </ScrollView>

      <Text
        style={[
          typography.label,
          { color: colors.textMuted, marginTop: spacing.md, marginBottom: 6, paddingHorizontal: spacing.md },
        ]}>
        Audio
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.trackContent, { paddingHorizontal: spacing.md }]}>
        <Pressable
          onPress={onAddAudio}
          style={[
            styles.addAudioBtn,
            { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
          ]}>
          <Ionicons name="musical-notes-outline" size={18} color={colors.text} />
          <Text style={[typography.caption, { color: colors.text, marginTop: 4 }]}>Add audio</Text>
        </Pressable>
        {session.audioTracks.map((track) => (
          <View
            key={track.id}
            style={[
              styles.audioBlock,
              {
                width: audioWidth(track),
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
                borderRadius: radius.sm,
              },
            ]}>
            <Ionicons name="musical-note" size={16} color={colors.text} />
            <Text style={[typography.caption, { color: colors.text, marginTop: 4 }]} numberOfLines={1}>
              {track.label}
            </Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {formatDuration(track.durationMs)}
            </Text>
            <Pressable
              onPress={() => handleDeleteAudio(track.id)}
              style={[styles.audioDelete, { backgroundColor: colors.danger }]}>
              <Ionicons name="close" size={12} color="#fff" />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <Text style={[typography.caption, { color: colors.textMuted, paddingHorizontal: spacing.md, marginTop: 8 }]}>
        Drag the handle on a clip to reorder · Tap clip to edit
      </Text>

      <View style={[styles.toolbar, { borderTopColor: colors.border, padding: spacing.md, backgroundColor: colors.surface }]}>
        <View style={styles.toolbarRow}>
          <Button label="Record" icon="videocam" onPress={onRecord} style={{ flex: 1 }} />
          <Button label="Import" icon="images" variant="secondary" onPress={onImport} style={{ flex: 1 }} />
        </View>
        <View style={[styles.toolbarRow, { marginTop: 10 }]}>
          <Button
            label="Preview"
            icon="play"
            variant="secondary"
            onPress={onPreview}
            style={{ flex: 1 }}
            disabled={session.clips.length === 0}
          />
          <Button
            label="Export"
            icon="share-outline"
            onPress={onExport}
            style={{ flex: 1 }}
            disabled={session.clips.length === 0}
          />
        </View>
      </View>
    </View>
  );
}

type TimelineClipBlockProps = {
  clip: Clip;
  index: number;
  width: number;
  selected: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragMove: (dx: number) => void;
  onDragEnd: (dx: number) => void;
};

function TimelineClipBlock({
  clip,
  index,
  width,
  selected,
  isDragging,
  isDropTarget,
  onSelect,
  onEdit,
  onDelete,
  onDragStart,
  onDragMove,
  onDragEnd,
}: TimelineClipBlockProps) {
  const { colors, typography, radius } = useThemeWithSpacing();

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => onDragStart(),
        onPanResponderMove: (_, gesture) => onDragMove(gesture.dx),
        onPanResponderRelease: (_, gesture) => onDragEnd(gesture.dx),
        onPanResponderTerminate: (_, gesture) => onDragEnd(gesture.dx),
      }),
    [onDragStart, onDragMove, onDragEnd],
  );

  return (
    <View
      style={[
        styles.clipBlock,
        {
          width,
          height: TRACK_HEIGHT,
          marginRight: GAP,
          borderColor: selected ? colors.accent : isDropTarget ? colors.success : colors.border,
          borderWidth: selected || isDropTarget ? 2 : 1,
          backgroundColor: colors.surface,
          borderRadius: radius.sm,
          opacity: isDragging ? 0.75 : 1,
          transform: isDragging ? [{ scale: 1.03 }] : [],
        },
      ]}>
      <Pressable onPress={onSelect} style={styles.clipBody}>
        <View style={[styles.clipThumb, { backgroundColor: colors.surfaceSecondary }]}>
          <Ionicons
            name={clip.type === 'video' ? 'videocam' : 'image'}
            size={18}
            color={colors.textMuted}
          />
        </View>
        <Text style={[typography.caption, { color: colors.text, fontWeight: '600' }]}>Clip {index + 1}</Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {formatDuration(getClipDurationMs(clip))}
        </Text>
      </Pressable>

      <Pressable
        onPress={onDelete}
        hitSlop={10}
        style={[styles.clipDelete, { backgroundColor: colors.danger }]}>
        <Ionicons name="close" size={12} color="#fff" />
      </Pressable>

      <Pressable onPress={onEdit} hitSlop={8} style={[styles.clipEdit, { backgroundColor: colors.surfaceSecondary }]}>
        <Ionicons name="pencil" size={11} color={colors.textSecondary} />
      </Pressable>

      <View {...panResponder.panHandlers} style={[styles.dragHandle, { backgroundColor: colors.surfaceSecondary }]}>
        <Ionicons name="reorder-three" size={16} color={colors.textSecondary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  previewWrap: {
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    maxHeight: 280,
  },
  previewEmpty: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruler: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  rulerLine: {
    flex: 1,
    height: 1,
  },
  trackContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 4,
  },
  emptyTrack: {
    height: TRACK_HEIGHT,
    minWidth: 200,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  addAudioBtn: {
    width: 88,
    height: TRACK_HEIGHT,
    marginRight: GAP,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioBlock: {
    height: TRACK_HEIGHT,
    marginRight: GAP,
    padding: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },
  audioDelete: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    marginTop: 'auto',
    borderTopWidth: 1,
  },
  toolbarRow: {
    flexDirection: 'row',
    gap: 10,
  },
  clipBlock: {
    position: 'relative',
    overflow: 'visible',
  },
  clipBody: {
    flex: 1,
    padding: 8,
    paddingRight: 28,
  },
  clipThumb: {
    width: '100%',
    height: 28,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  clipDelete: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  clipEdit: {
    position: 'absolute',
    top: 4,
    right: 28,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  dragHandle: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
});
