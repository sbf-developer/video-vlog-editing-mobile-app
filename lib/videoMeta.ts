import { Platform } from 'react-native';

import type { Clip } from './types';

const MIN_TRIM_MS = 300;

export function getClipBounds(clip: Clip): { startMs: number; endMs: number; durationMs: number } {
  if (clip.type === 'image') {
    return { startMs: 0, endMs: 3000, durationMs: 3000 };
  }

  const endMs = clip.trimEndMs > 0 ? clip.trimEndMs : clip.durationMs;
  const startMs = Math.min(clip.trimStartMs, endMs);
  return {
    startMs,
    endMs,
    durationMs: Math.max(0, endMs - startMs),
  };
}

export function clampTrimStart(clip: Clip, startMs: number): number {
  const endMs = clip.trimEndMs > 0 ? clip.trimEndMs : clip.durationMs;
  return Math.max(0, Math.min(startMs, endMs - MIN_TRIM_MS));
}

export function clampTrimEnd(clip: Clip, endMs: number): number {
  const max = clip.durationMs;
  const minEnd = clip.trimStartMs + MIN_TRIM_MS;
  return Math.max(minEnd, Math.min(endMs, max));
}

export async function probeVideoDurationMs(uri: string): Promise<number> {
  if (Platform.OS === 'web') {
    return probeWebVideoDurationMs(uri);
  }

  try {
    const { Audio } = await import('expo-av');
    const { sound, status } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
    const duration = status.isLoaded ? (status.durationMillis ?? 0) : 0;
    await sound.unloadAsync();
    return duration;
  } catch {
    return 0;
  }
}

function probeWebVideoDurationMs(uri: string): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => resolve(Math.round((video.duration || 0) * 1000));
    video.onerror = () => resolve(0);
    video.src = uri;
  });
}
