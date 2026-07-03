import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { SessionCard } from '@/components/SessionCard';
import { Button, EmptyState, Input } from '@/components/ui/Button';
import { confirmAction } from '@/lib/confirm';
import { useVlog } from '@/context/VlogContext';
import { useThemeWithSpacing } from '@/hooks/useTheme';
import type { VlogSession } from '@/lib/types';

type ModalMode = 'create' | 'rename';

export default function HomeScreen() {
  const { sessions, loading, createNewSession, renameSession, deleteSession, refresh } = useVlog();
  const { colors, spacing, typography } = useThemeWithSpacing();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [nameDraft, setNameDraft] = useState('');
  const [editingSession, setEditingSession] = useState<VlogSession | null>(null);

  const openCreate = () => {
    const nextNum = sessions.length + 1;
    setModalMode('create');
    setEditingSession(null);
    setNameDraft(`Vlog ${nextNum}`);
    setModalVisible(true);
  };

  const openRename = (session: VlogSession) => {
    setModalMode('rename');
    setEditingSession(session);
    setNameDraft(session.name);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setNameDraft('');
    setEditingSession(null);
  };

  const handleSubmit = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) return;

    if (modalMode === 'create') {
      const session = await createNewSession(trimmed);
      closeModal();
      router.push(`/session/${session.id}`);
      return;
    }

    if (editingSession) {
      await renameSession(editingSession.id, trimmed);
      closeModal();
    }
  };

  const confirmDelete = async (session: VlogSession) => {
    const ok = await confirmAction(
      `Delete "${session.name}"?`,
      'This removes the folder and all clips inside it.',
      'Delete',
    );
    if (ok) deleteSession(session.id);
  };

  const { width } = useWindowDimensions();
  const numColumns = width >= 960 ? 4 : width >= 640 ? 3 : 2;
  const gap = spacing.sm;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingTop: spacing.md }]}>
        <View>
          <Text style={[typography.title, { color: colors.text }]}>Vlog</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 6 }]}>
            Capture clips. Export when done.
          </Text>
        </View>
        <Button label="New" icon="add" size="sm" onPress={openCreate} />
      </View>

      <FlatList
        key={`grid-${numColumns}`}
        data={sessions}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? { gap } : undefined}
        contentContainerStyle={[
          styles.list,
          { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
          sessions.length === 0 && styles.listEmpty,
        ]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.text} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="film-outline"
              title="No vlogs yet"
              subtitle="Create a session, record quick clips, and export your vlog in minutes."
            />
          ) : null
        }
        renderItem={({ item, index }) => (
          <View
            style={{
              flex: 1,
              marginRight: (index + 1) % numColumns === 0 ? 0 : gap,
            }}>
            <SessionCard
              session={item}
              onPress={() => router.push(`/session/${item.id}`)}
              onRename={() => openRename(item)}
              onDelete={() => confirmDelete(item)}
            />
          </View>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modal, { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg }]}>
            <Text style={[typography.heading, { color: colors.text, marginBottom: spacing.md }]}>
              {modalMode === 'create' ? 'Name your vlog' : 'Rename vlog'}
            </Text>
            <Input
              label="Folder name"
              value={nameDraft}
              onChangeText={setNameDraft}
              autoFocus
              placeholder="Vlog 1"
              onSubmitEditing={handleSubmit}
            />
            <View style={{ marginTop: spacing.lg, gap: 10 }}>
              <Button
                label={modalMode === 'create' ? 'Create session' : 'Save name'}
                onPress={handleSubmit}
                fullWidth
                icon={modalMode === 'create' ? 'folder-open' : 'checkmark'}
              />
              <Button label="Cancel" variant="ghost" onPress={closeModal} fullWidth />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  list: { paddingTop: 8 },
  listEmpty: { flexGrow: 1 },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
  },
});
