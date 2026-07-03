import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import type { Clip, VlogSession } from './types';
import { ensureSessionDir, getSessionDir } from './storage';

export type ExportProgress = {
  stage: 'preparing' | 'processing' | 'saving' | 'done' | 'error';
  progress: number;
  message: string;
};

export type ExportResult = {
  success: boolean;
  outputUri?: string;
  savedToGallery: boolean;
  sharedAsProject: boolean;
  message: string;
};

async function saveClipsToGallery(
  session: VlogSession,
  onProgress?: (p: ExportProgress) => void,
): Promise<boolean> {
  if (Platform.OS === 'web') {
    onProgress?.({
      stage: 'error',
      progress: 0,
      message: 'Saving to gallery is not supported on web.',
    });
    return false;
  }

  const MediaLibrary = await import('expo-media-library');
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') return false;

  onProgress?.({
    stage: 'saving',
    progress: 0.5,
    message: 'Saving clips to gallery…',
  });

  let album = await MediaLibrary.getAlbumAsync(session.name);
  for (let i = 0; i < session.clips.length; i++) {
    const clip = session.clips[i];
    const asset = await MediaLibrary.createAssetAsync(clip.uri);
    if (album) {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    } else {
      album = await MediaLibrary.createAlbumAsync(session.name, asset, false);
    }
    onProgress?.({
      stage: 'saving',
      progress: 0.5 + (0.4 * (i + 1)) / session.clips.length,
      message: `Saved ${i + 1}/${session.clips.length} clips`,
    });
  }
  return true;
}

async function exportProjectBundle(
  session: VlogSession,
  onProgress?: (p: ExportProgress) => void,
): Promise<string | null> {
  if (Platform.OS === 'web') {
    onProgress?.({
      stage: 'processing',
      progress: 0.3,
      message: 'Project metadata ready (web preview)',
    });
    return getSessionDir(session.id);
  }

  const dir = await ensureSessionDir(session.id);
  const manifest = {
    name: session.name,
    exportedAt: new Date().toISOString(),
    clips: session.clips.map((c, i) => ({
      order: i + 1,
      type: c.type,
      filename: c.filename,
      trimStartMs: c.trimStartMs,
      trimEndMs: c.trimEndMs,
      textOverlays: c.textOverlays,
    })),
  };

  const manifestPath = `${dir}project.json`;
  await FileSystem.writeAsStringAsync(manifestPath, JSON.stringify(manifest, null, 2));

  onProgress?.({
    stage: 'processing',
    progress: 0.3,
    message: 'Project saved locally',
  });

  return dir;
}

export async function exportVlog(
  session: VlogSession,
  options: { saveToGallery: boolean; shareProject: boolean },
  onProgress?: (p: ExportProgress) => void,
): Promise<ExportResult> {
  if (session.clips.length === 0) {
    return {
      success: false,
      savedToGallery: false,
      sharedAsProject: false,
      message: 'Add at least one clip before exporting.',
    };
  }

  onProgress?.({ stage: 'preparing', progress: 0.1, message: 'Preparing export…' });

  let savedToGallery = false;
  let sharedAsProject = false;

  if (options.saveToGallery) {
    savedToGallery = await saveClipsToGallery(session, onProgress);
  }

  const projectDir = await exportProjectBundle(session, onProgress);

  if (options.shareProject && projectDir && Platform.OS !== 'web') {
    const Sharing = await import('expo-sharing');
    if (await Sharing.isAvailableAsync()) {
      onProgress?.({ stage: 'processing', progress: 0.8, message: 'Opening share sheet…' });
      await Sharing.shareAsync(projectDir, {
        dialogTitle: `Share ${session.name}`,
        mimeType: 'application/json',
      });
      sharedAsProject = true;
    }
  }

  onProgress?.({ stage: 'done', progress: 1, message: 'Export complete' });

  const parts: string[] = [];
  if (savedToGallery) parts.push('Clips saved to your gallery album.');
  if (sharedAsProject) parts.push('Project folder shared.');
  if (parts.length === 0) {
    parts.push(
      Platform.OS === 'web'
        ? 'Project metadata saved. Use Expo Go on a phone for full export.'
        : 'Project saved on device.',
    );
  }

  return {
    success: true,
    outputUri: projectDir ?? undefined,
    savedToGallery,
    sharedAsProject,
    message: parts.join(' '),
  };
}
