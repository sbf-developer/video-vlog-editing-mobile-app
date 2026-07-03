import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TimelineEditor } from '@/components/TimelineEditor';
import { Button, Input } from '@/components/ui/Button';
import { useVlog } from '@/context/VlogContext';
import { useThemeWithSpacing } from '@/hooks/useTheme';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getSession,
    renameSession,
    removeClip,
    reorderClips,
    addClipFromUri,
    addAudioFromUri,
    removeAudioTrack,
    updateClip,
    splitClip,
    loading,
  } = useVlog();
  const { colors, spacing, typography } = useThemeWithSpacing();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const session = getSession(id);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[typography.body, { color: colors.textSecondary, padding: spacing.md }]}>
          Loading…
        </Text>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ padding: spacing.md, gap: spacing.md }}>
          <Text style={[typography.body, { color: colors.text }]}>Session not found.</Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            It may have been deleted, or this link is from an old browser tab.
          </Text>
          <Button label="Back to home" onPress={() => router.replace('/')} />
        </View>
      </SafeAreaView>
    );
  }

  const saveName = async () => {
    await renameSession(session.id, nameDraft);
    setEditingName(false);
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 1,
      videoMaxDuration: 60,
    });

    if (result.canceled) return;

    for (const asset of result.assets) {
      const type = asset.type === 'video' ? 'video' : 'image';
      const durationMs = type === 'video' ? (asset.duration ?? 0) * 1000 : 3000;
      await addClipFromUri(session.id, asset.uri, type, durationMs);
    }
  };

  const pickAudio = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: Platform.OS === 'web' ? 'audio/*' : ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-m4a'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const label = asset.name.replace(/\.[^.]+$/, '') || 'Audio';
    await addAudioFromUri(session.id, asset.uri, 30000, label);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingTop: spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          {editingName ? (
            <Input value={nameDraft} onChangeText={setNameDraft} onSubmitEditing={saveName} autoFocus />
          ) : (
            <Pressable
              onPress={() => {
                setNameDraft(session.name);
                setEditingName(true);
              }}>
              <Text style={[typography.heading, { color: colors.text }]} numberOfLines={1}>
                {session.name}
              </Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>Tap to rename</Text>
            </Pressable>
          )}
        </View>
        {editingName ? (
          <Pressable onPress={saveName}>
            <Ionicons name="checkmark" size={26} color={colors.success} />
          </Pressable>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: spacing.md }}>
        <TimelineEditor
          session={session}
          onEditClip={(clipId) => router.push(`/session/${session.id}/edit/${clipId}`)}
          onUpdateClip={(clipId, updates) => updateClip(session.id, clipId, updates)}
          onSplitClip={(clipId, splitAt) => splitClip(session.id, clipId, splitAt)}
          onDeleteClip={(clipId) => removeClip(session.id, clipId)}
          onReorderClips={(clipIds) => reorderClips(session.id, clipIds)}
          onDeleteAudio={(trackId) => removeAudioTrack(session.id, trackId)}
          onAddAudio={pickAudio}
          onRecord={() => router.push(`/session/${session.id}/capture`)}
          onImport={pickFromGallery}
          onPreview={() => router.push(`/session/${session.id}/preview`)}
          onExport={() => router.push(`/session/${session.id}/export`)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backBtn: { width: 36 },
  headerCenter: { flex: 1, alignItems: 'center' },
});
