import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

import type { AudioTrack, Clip, VlogSession } from './types';

const SESSIONS_KEY = '@vlog_sessions';
const isWeb = Platform.OS === 'web';
const PROJECTS_DIR = isWeb ? 'web://vlog-projects/' : `${FileSystem.documentDirectory}vlog-projects/`;

export async function ensureProjectsDir(): Promise<void> {
  if (isWeb) return;

  const info = await FileSystem.getInfoAsync(PROJECTS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PROJECTS_DIR, { intermediates: true });
  }
}

export function getSessionDir(sessionId: string): string {
  return `${PROJECTS_DIR}${sessionId}/`;
}

export async function ensureSessionDir(sessionId: string): Promise<string> {
  if (isWeb) return getSessionDir(sessionId);

  await ensureProjectsDir();
  const dir = getSessionDir(sessionId);
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

export async function loadSessions(): Promise<VlogSession[]> {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VlogSession[];
    return parsed.map((session) => ({
      ...session,
      audioTracks: session.audioTracks ?? [],
    }));
  } catch {
    return [];
  }
}

export async function saveSessions(sessions: VlogSession[]): Promise<void> {
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export async function copyMediaToSession(
  sessionId: string,
  sourceUri: string,
  extension: string,
): Promise<{ uri: string; filename: string }> {
  const filename = `${uuidv4()}.${extension}`;

  // Web: keep the blob URL in browser memory — no native folder APIs on web.
  if (isWeb) {
    return { uri: sourceUri, filename };
  }

  const dir = await ensureSessionDir(sessionId);
  const dest = `${dir}${filename}`;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return { uri: dest, filename };
}

export async function deleteSessionFiles(sessionId: string): Promise<void> {
  if (isWeb) return;

  const dir = getSessionDir(sessionId);
  const info = await FileSystem.getInfoAsync(dir);
  if (info.exists) {
    await FileSystem.deleteAsync(dir, { idempotent: true });
  }
}

export async function deleteClipFile(uri: string): Promise<void> {
  if (isWeb) {
    if (uri.startsWith('blob:')) {
      URL.revokeObjectURL(uri);
    }
    return;
  }

  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}

export function getClipExtension(uri: string, type: Clip['type']): string {
  if (uri.startsWith('blob:')) {
    return type === 'video' ? 'webm' : 'jpg';
  }
  const match = uri.match(/\.(\w+)(?:\?|$)/);
  if (match) return match[1].toLowerCase();
  return type === 'video' ? 'mp4' : 'jpg';
}

export function createSession(name: string): VlogSession {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    name,
    clips: [],
    audioTracks: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createAudioTrack(uri: string, filename: string, durationMs: number, label: string): AudioTrack {
  return {
    id: uuidv4(),
    uri,
    filename,
    durationMs,
    label,
  };
}

export function createClip(
  type: Clip['type'],
  uri: string,
  filename: string,
  durationMs: number,
): Clip {
  return {
    id: uuidv4(),
    type,
    uri,
    filename,
    durationMs,
    trimStartMs: 0,
    trimEndMs: durationMs,
    textOverlays: [],
    createdAt: new Date().toISOString(),
  };
}

export function sortSessionsByUpdated(sessions: VlogSession[]): VlogSession[] {
  return [...sessions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}
