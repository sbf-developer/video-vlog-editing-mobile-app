import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { CaptureOverlay } from '@/components/camera/CaptureOverlay';
import {
  DEFAULT_MAX_DURATION,
  type CameraCaptureProps,
  type MaxDurationSec,
} from '@/components/camera/shared';
import { useThemeWithSpacing } from '@/hooks/useTheme';

export { DURATION_PRESETS, type DurationPreset, type MaxDurationSec } from '@/components/camera/shared';

export function CameraCapture({
  maxDurationSec = DEFAULT_MAX_DURATION,
  onMaxDurationChange,
  onRecorded,
  onCancel,
}: CameraCaptureProps) {
  const { colors, spacing, typography } = useThemeWithSpacing();
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordStartRef = useRef<number>(0);
  const recordingRef = useRef(false);

  const isUnlimited = maxDurationSec === null;

  useEffect(() => {
    if (!recording) setElapsedSec(0);
  }, [maxDurationSec, recording]);

  const requestPermissions = async () => {
    const cam = await requestCameraPermission();
    const mic = await requestMicPermission();
    return cam?.granted && mic?.granted;
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopRecording = () => {
    stopTimer();
    if (cameraRef.current && recordingRef.current) {
      cameraRef.current.stopRecording();
    }
  };

  const startTimer = () => {
    stopTimer();
    if (isUnlimited) {
      setElapsedSec(0);
      timerRef.current = setInterval(() => setElapsedSec((prev) => prev + 1), 1000);
      return;
    }
    setElapsedSec(maxDurationSec);
    timerRef.current = setInterval(() => {
      setElapsedSec((prev) => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finishRecording = async (uri: string | undefined) => {
    stopTimer();
    recordingRef.current = false;
    setRecording(false);
    if (!uri) {
      Alert.alert('Recording failed', 'No video was captured. Please try again.');
      return;
    }
    const elapsed = Date.now() - recordStartRef.current;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onRecorded(uri, elapsed);
  };

  const startRecording = async () => {
    if (!cameraReady) {
      Alert.alert('Camera loading', 'Wait a moment for the camera to be ready, then try again.');
      return;
    }
    if (!cameraRef.current || recordingRef.current) return;

    recordingRef.current = true;
    setRecording(true);
    recordStartRef.current = Date.now();
    startTimer();

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const options = isUnlimited ? undefined : { maxDuration: maxDurationSec };
      const video = await cameraRef.current.recordAsync(options);
      await finishRecording(video?.uri);
    } catch {
      stopTimer();
      recordingRef.current = false;
      setRecording(false);
      Alert.alert('Recording failed', 'Please try again.');
    }
  };

  const durationLabel = () => {
    if (recording) return isUnlimited ? `${elapsedSec}s` : `${elapsedSec}s left`;
    if (isUnlimited) return 'No limit';
    return `${maxDurationSec}s max`;
  };

  const hintText = () => {
    if (!cameraReady) return 'Preparing camera…';
    if (recording) return 'Tap stop when you are done';
    if (isUnlimited) return 'Tap to record · no time limit';
    return `Tap to record · up to ${maxDurationSec}s`;
  };

  if (!cameraPermission?.granted || !micPermission?.granted) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <Ionicons name="camera-outline" size={56} color={colors.textMuted} />
        <Text style={[typography.heading, { color: colors.text, marginTop: spacing.md, textAlign: 'center' }]}>
          Camera access needed
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }]}>
          Allow camera and microphone to record vlog clips.
        </Text>
        <Pressable
          onPress={requestPermissions}
          style={[styles.permissionBtn, { backgroundColor: colors.accent, borderRadius: 12 }]}>
          <Text style={[typography.body, { color: colors.accentText, fontWeight: '600' }]}>Grant access</Text>
        </Pressable>
        <Pressable onPress={onCancel} style={{ marginTop: 12 }}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        mode="video"
        facing="back"
        onCameraReady={() => setCameraReady(true)}
      />
      <CaptureOverlay
        maxDurationSec={maxDurationSec}
        onMaxDurationChange={onMaxDurationChange}
        onCancel={onCancel}
        recording={recording}
        elapsedSec={elapsedSec}
        cameraReady={cameraReady}
        onRecordPress={recording ? stopRecording : startRecording}
        hintText={hintText()}
        durationLabel={durationLabel()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  permissionBtn: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
});
