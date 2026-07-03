import type { Clip } from './types';
import { getClipBounds } from './videoMeta';

const IMAGE_DURATION_MS = 3000;

export function getClipDurationMs(clip: Clip): number {
  return getClipBounds(clip).durationMs;
}

function getEffectiveDuration(clip: Clip): number {
  return getClipDurationMs(clip);
}

export function getTotalDurationMs(clips: Clip[]): number {
  return clips.reduce((total, clip) => {
    if (clip.type === 'image') return total + IMAGE_DURATION_MS;
    return total + getEffectiveDuration(clip);
  }, 0);
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec}s`;
}
