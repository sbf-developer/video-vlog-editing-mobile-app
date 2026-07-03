import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { useVlog } from '@/context/VlogContext';
import { useThemeWithSpacing } from '@/hooks/useTheme';
import { formatDuration, getTotalDurationMs } from '@/lib/duration';
import { exportVlog, type ExportProgress } from '@/lib/export';

export default function ExportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getSession } = useVlog();
  const { colors, spacing, typography } = useThemeWithSpacing();
  const session = getSession(id);

  const [saveToGallery, setSaveToGallery] = useState(true);
  const [shareProject, setShareProject] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  if (!session) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, padding: 16 }}>Session not found.</Text>
      </SafeAreaView>
    );
  }

  const handleExport = async () => {
    setExporting(true);
    setResultMessage(null);
    try {
      const result = await exportVlog(
        session,
        { saveToGallery, shareProject },
        setProgress,
      );
      setResultMessage(result.message);
    } catch {
      setResultMessage('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </Pressable>
          <Text style={[typography.heading, { color: colors.text }]}>Export</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={{ padding: spacing.md, flex: 1 }}>
          <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, padding: spacing.md }]}>
            <Text style={[typography.heading, { color: colors.text }]}>{session.name}</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: 4 }]}>
              {session.clips.length} clips · {formatDuration(getTotalDurationMs(session.clips))}
            </Text>
          </View>

          <View style={{ marginTop: spacing.lg }}>
            <OptionRow
              label="Save to camera roll"
              subtitle="Creates an album with all clips in order"
              value={saveToGallery}
              onChange={setSaveToGallery}
            />
            <OptionRow
              label="Share project folder"
              subtitle="Includes clips + project.json metadata"
              value={shareProject}
              onChange={setShareProject}
            />
          </View>

          {progress && exporting ? (
            <View style={{ marginTop: spacing.lg, alignItems: 'center' }}>
              <ActivityIndicator color={colors.accent} />
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 8 }]}>
                {progress.message}
              </Text>
            </View>
          ) : null}

          {resultMessage ? (
            <View style={[styles.result, { backgroundColor: colors.surfaceSecondary, borderRadius: 8, marginTop: spacing.lg, padding: spacing.md }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={[typography.body, { color: colors.text, marginLeft: 8, flex: 1 }]}>
                {resultMessage}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ padding: spacing.md }}>
          <Button
            label={exporting ? 'Exporting…' : 'Export vlog'}
            icon="share-outline"
            onPress={handleExport}
            loading={exporting}
            fullWidth
            disabled={session.clips.length === 0}
          />
        </View>
      </SafeAreaView>
    </>
  );
}

function OptionRow({
  label,
  subtitle,
  value,
  onChange,
}: {
  label: string;
  subtitle: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { colors, spacing, typography } = useThemeWithSpacing();

  return (
    <View
      style={[
        styles.option,
        { borderBottomColor: colors.border, paddingVertical: spacing.md },
      ]}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>{label}</Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.accent }} />
    </View>
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
  summary: { borderWidth: 1 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
