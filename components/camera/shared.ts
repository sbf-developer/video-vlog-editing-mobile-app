import { DEFAULT_CAPTURE_DURATION_SEC } from '@/lib/types';

export const DURATION_PRESETS = [3, 5, 10, 30] as const;
export type DurationPreset = (typeof DURATION_PRESETS)[number];
export type MaxDurationSec = DurationPreset | null;

export type CameraCaptureProps = {
  maxDurationSec?: MaxDurationSec;
  onMaxDurationChange?: (value: MaxDurationSec) => void;
  onRecorded: (uri: string, durationMs: number) => void;
  onCancel: () => void;
};

export const DEFAULT_MAX_DURATION: MaxDurationSec = DEFAULT_CAPTURE_DURATION_SEC;

export function getRecordingExtension(): string {
  return 'webm';
}
