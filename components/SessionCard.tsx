import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemeWithSpacing } from '@/hooks/useTheme';
import type { VlogSession } from '@/lib/types';
import { formatDuration, getTotalDurationMs } from '@/lib/duration';

type SessionCardProps = {
  session: VlogSession;
  onPress: () => void;
  onRename: () => void;
  onDelete: () => void;
};

export function SessionCard({ session, onPress, onRename, onDelete }: SessionCardProps) {
  const { colors, radius, spacing, typography } = useThemeWithSpacing();
  const clipCount = session.clips.length;
  const duration = formatDuration(getTotalDurationMs(session.clips));
  const updated = new Date(session.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          opacity: pressed ? 0.92 : 1,
        },
      ]}>
      <View style={[styles.cover, { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md }]}>
        <Ionicons name="folder-open-outline" size={32} color={colors.textMuted} />
        {clipCount > 0 ? (
          <View style={[styles.clipBadge, { backgroundColor: colors.text }]}>
            <Text style={[typography.caption, { color: colors.accentText, fontFamily: typography.button.fontFamily }]}>
              {clipCount}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={[typography.heading, { color: colors.text, marginTop: spacing.sm }]} numberOfLines={1}>
        {session.name}
      </Text>
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]} numberOfLines={1}>
        {duration} · {updated}
      </Text>

      <View style={styles.actions}>
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onRename();
          }}
          hitSlop={6}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: colors.surfaceSecondary, borderRadius: radius.full, opacity: pressed ? 0.7 : 1 },
          ]}>
          <Ionicons name="pencil-outline" size={14} color={colors.textSecondary} />
        </Pressable>
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onDelete();
          }}
          hitSlop={6}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: colors.surfaceSecondary, borderRadius: radius.full, opacity: pressed ? 0.7 : 1 },
          ]}>
          <Ionicons name="trash-outline" size={14} color={colors.danger} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    minWidth: 0,
  },
  cover: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  clipBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 10,
  },
  actionBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
