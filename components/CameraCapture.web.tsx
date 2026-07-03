import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { CaptureOverlay } from '@/components/camera/CaptureOverlay';
import {
  DEFAULT_MAX_DURATION,
  type CameraCaptureProps,
  type MaxDurationSec,
} from '@/components/camera/shared';
import { useThemeWithSpacing } from '@/hooks/useTheme';
import {
  requestWebCameraStream,
  stopWebStream,
  WebMediaRecorder,
} from '@/lib/webRecording';

export { DURATION_PRESETS, type DurationPreset, type MaxDurationSec } from '@/components/camera/shared';

export function CameraCapture({
  maxDurationSec = DEFAULT_MAX_DURATION,
  onMaxDurationChange,
  onRecorded,
  onCancel,
}: CameraCaptureProps) {
  const { colors, spacing, typography } = useThemeWithSpacing();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pendingStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<WebMediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [permissionDenied, setPermissionDenied] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  const isUnlimited = maxDurationSec === null;

  const bindStreamToVideo = async (stream: MediaStream) => {
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraReady(true);
      return;
    }
    pendingStreamRef.current = stream;
  };

  useEffect(() => {
    let mounted = true;

    async function setup() {
      try {
        const stream = await requestWebCameraStream();
        if (!mounted) {
          stopWebStream(stream);
          return;
        }
        await bindStreamToVideo(stream);
      } catch {
        if (mounted) setPermissionDenied(true);
      }
    }

    setup();

    return () => {
      mounted = false;
      stopTimer();
      stopWebStream(streamRef.current);
      streamRef.current = null;
      pendingStreamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!recording) setElapsedSec(0);
  }, [maxDurationSec, recording]);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = (onAutoStop: () => void) => {
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
          onAutoStop();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finishRecording = async (uri: string, durationMs: number) => {
    stopTimer();
    setRecording(false);
    recorderRef.current = null;

    if (!uri) {
      Alert.alert('Recording failed', 'No video was captured. Please try again.');
      return;
    }

    onRecorded(uri, durationMs);
  };

  const stopRecording = () => {
    recorderRef.current?.requestStop();
  };

  const startRecording = async () => {
    if (!cameraReady || !streamRef.current || recording) return;

    const recorder = new WebMediaRecorder(streamRef.current);
    recorderRef.current = recorder;
    setRecording(true);
    startTimer(stopRecording);

    try {
      const resultPromise = recorder.start(isUnlimited ? null : maxDurationSec);
      const result = await resultPromise;
      await finishRecording(result.uri, result.durationMs);
    } catch {
      stopTimer();
      setRecording(false);
      recorderRef.current = null;
      Alert.alert('Recording failed', 'Please try again.');
    }
  };

  const handleRecordPress = () => {
    if (recording) {
      void stopRecording();
    } else {
      void startRecording();
    }
  };

  const retryPermissions = async () => {
    setPermissionDenied(false);
    setCameraReady(false);
    try {
      const stream = await requestWebCameraStream();
      await bindStreamToVideo(stream);
    } catch {
      setPermissionDenied(true);
    }
  };

  const durationLabel = () => {
    if (recording) return isUnlimited ? `${elapsedSec}s` : `${elapsedSec}s left`;
    if (isUnlimited) return 'No limit';
    return `${maxDurationSec}s max`;
  };

  const hintText = () => {
    if (!cameraReady) return 'Preparing webcam…';
    if (recording) return 'Tap stop when you are done';
    if (isUnlimited) return 'Tap to record · no time limit';
    return `Tap to record · up to ${maxDurationSec}s`;
  };

  if (permissionDenied) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <Ionicons name="camera-outline" size={56} color={colors.textMuted} />
        <Text style={[typography.heading, { color: colors.text, marginTop: spacing.md, textAlign: 'center' }]}>
          Webcam access needed
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }]}>
          Allow camera and microphone in your browser to record clips.
        </Text>
        <Pressable
          onPress={retryPermissions}
          style={[styles.permissionBtn, { backgroundColor: colors.accent, borderRadius: 12 }]}>
          <Text style={[typography.body, { color: colors.accentText, fontWeight: '600' }]}>Try again</Text>
        </Pressable>
        <Pressable onPress={onCancel} style={{ marginTop: 12 }}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <video
        ref={(node) => {
          videoRef.current = node;
          if (node && pendingStreamRef.current) {
            node.srcObject = pendingStreamRef.current;
            void node.play();
            setCameraReady(true);
            pendingStreamRef.current = null;
          }
        }}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          backgroundColor: '#000',
          transform: 'scaleX(-1)',
        }}
      />
      <CaptureOverlay
        maxDurationSec={maxDurationSec}
        onMaxDurationChange={onMaxDurationChange}
        onCancel={onCancel}
        recording={recording}
        elapsedSec={elapsedSec}
        cameraReady={cameraReady}
        onRecordPress={handleRecordPress}
        hintText={hintText()}
        durationLabel={durationLabel()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', position: 'relative' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  permissionBtn: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
});
