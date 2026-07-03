import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  DURATION_PRESETS,
  type CameraCaptureProps,
  type MaxDurationSec,
} from '@/components/camera/shared';
import { useThemeWithSpacing } from '@/hooks/useTheme';

type CaptureOverlayProps = Pick<
  CameraCaptureProps,
  'maxDurationSec' | 'onMaxDurationChange' | 'onCancel'
> & {
  recording: boolean;
  elapsedSec: number;
  cameraReady: boolean;
  onRecordPress: () => void;
  hintText: string;
  durationLabel: string;
  recordDisabled?: boolean;
};

export function CaptureOverlay({
  maxDurationSec = 10,
  onMaxDurationChange,
  onCancel,
  recording,
  elapsedSec,
  cameraReady,
  onRecordPress,
  hintText,
  durationLabel,
  recordDisabled,
}: CaptureOverlayProps) {
  const { spacing, typography } = useThemeWithSpacing();
  const isUnlimited = maxDurationSec === null;
  const disabled = recordDisabled ?? (!recording && !cameraReady);

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={[styles.topBar, { paddingTop: spacing.md }]} pointerEvents="box-none">
        <Pressable onPress={onCancel} hitSlop={12} style={styles.closeBtn}>
          <Text style={[typography.body, { color: '#fff', fontWeight: '600' }]}>Close</Text>
        </Pressable>

        {onMaxDurationChange ? (
          <View style={styles.durationRow}>
            {DURATION_PRESETS.map((sec) => (
              <Pressable
                key={sec}
                disabled={recording}
                onPress={() => onMaxDurationChange(sec)}
                style={[
                  styles.durationChip,
                  {
                    backgroundColor: maxDurationSec === sec ? '#FFFFFF' : 'rgba(0,0,0,0.55)',
                    opacity: recording ? 0.5 : 1,
                  },
                ]}>
                <Text
                  style={[
                    typography.caption,
                    {
                      color: maxDurationSec === sec ? '#000' : '#fff',
                      fontWeight: '700',
                    },
                  ]}>
                  {sec}s
                </Text>
              </Pressable>
            ))}
            <Pressable
              disabled={recording}
              onPress={() => onMaxDurationChange(null)}
              style={[
                styles.durationChip,
                {
                  backgroundColor: isUnlimited ? '#FFFFFF' : 'rgba(0,0,0,0.55)',
                  opacity: recording ? 0.5 : 1,
                },
              ]}>
              <Text
                style={[
                  typography.caption,
                  { color: isUnlimited ? '#000' : '#fff', fontWeight: '700', fontSize: 16 },
                ]}>
                ∞
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.timerBadge}>
          <Text style={[typography.caption, { color: '#fff', fontWeight: '700' }]}>
            {durationLabel}
          </Text>
        </View>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: spacing.xl }]} pointerEvents="box-none">
        <Text style={[typography.caption, styles.hint]}>{hintText}</Text>
        <Pressable
          onPress={onRecordPress}
          disabled={disabled}
          style={({ pressed }) => [
            styles.recordBtn,
            {
              backgroundColor: recording ? '#E5484D' : '#FFFFFF',
              opacity: pressed ? 0.85 : disabled ? 0.5 : 1,
            },
          ]}>
          <Ionicons
            name={recording ? 'stop' : 'radio-button-on'}
            size={20}
            color={recording ? '#fff' : '#111'}
          />
          <Text
            style={[
              typography.body,
              { color: recording ? '#fff' : '#111', fontWeight: '700', marginLeft: 8 },
            ]}>
            {recording ? 'Stop' : 'Record clip'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
  },
  topBar: {
    paddingHorizontal: 16,
    gap: 12,
  },
  closeBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 40,
    alignItems: 'center',
  },
  timerBadge: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  bottomBar: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  hint: {
    color: '#fff',
    opacity: 0.85,
    marginBottom: 12,
    textAlign: 'center',
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 20,
  },
});
