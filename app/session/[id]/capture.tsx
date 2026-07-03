import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

import { CameraCapture, type MaxDurationSec } from '@/components/CameraCapture';
import { useVlog } from '@/context/VlogContext';

export default function CaptureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addClipFromUri } = useVlog();
  const [maxDuration, setMaxDuration] = useState<MaxDurationSec>(10);

  const handleRecorded = async (uri: string, durationMs: number) => {
    await addClipFromUri(id, uri, 'video', durationMs);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <CameraCapture
        maxDurationSec={maxDuration}
        onMaxDurationChange={setMaxDuration}
        onRecorded={handleRecorded}
        onCancel={() => router.back()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
});
