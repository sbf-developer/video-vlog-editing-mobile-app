import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { v4 as uuidv4 } from 'uuid';

import type { AudioTrack, Clip, VlogSession } from '@/lib/types';
import {
  copyMediaToSession,
  createAudioTrack,
  createClip,
  createSession,
  deleteClipFile,
  deleteSessionFiles,
  getClipExtension,
  loadSessions,
  saveSessions,
  sortSessionsByUpdated,
} from '@/lib/storage';
import { probeVideoDurationMs } from '@/lib/videoMeta';

type VlogContextValue = {
  sessions: VlogSession[];
  loading: boolean;
  createNewSession: (name: string) => Promise<VlogSession>;
  renameSession: (sessionId: string, name: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  getSession: (sessionId: string) => VlogSession | undefined;
  addClipFromUri: (
    sessionId: string,
    uri: string,
    type: Clip['type'],
    durationMs?: number,
  ) => Promise<Clip | null>;
  updateClip: (sessionId: string, clipId: string, updates: Partial<Clip>) => Promise<void>;
  removeClip: (sessionId: string, clipId: string) => Promise<void>;
  reorderClips: (sessionId: string, clipIds: string[]) => Promise<void>;
  addAudioFromUri: (
    sessionId: string,
    uri: string,
    durationMs: number,
    label: string,
  ) => Promise<AudioTrack | null>;
  removeAudioTrack: (sessionId: string, trackId: string) => Promise<void>;
  splitClip: (sessionId: string, clipId: string, splitAtSourceMs: number) => Promise<void>;
  refresh: () => Promise<void>;
};

const VlogContext = createContext<VlogContextValue | null>(null);

export function VlogProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<VlogSession[]>([]);
  const [loading, setLoading] = useState(true);

  const persist = useCallback(async (next: VlogSession[]) => {
    const sorted = sortSessionsByUpdated(next);
    setSessions(sorted);
    await saveSessions(sorted);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await loadSessions();
    setSessions(sortSessionsByUpdated(data));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const touchSession = (session: VlogSession): VlogSession => ({
    ...session,
    updatedAt: new Date().toISOString(),
  });

  const createNewSession = useCallback(
    async (name: string) => {
      const session = createSession(name.trim() || 'Untitled Vlog');
      await persist([session, ...sessions]);
      return session;
    },
    [persist, sessions],
  );

  const renameSession = useCallback(
    async (sessionId: string, name: string) => {
      const next = sessions.map((s) =>
        s.id === sessionId ? touchSession({ ...s, name: name.trim() || s.name }) : s,
      );
      await persist(next);
    },
    [persist, sessions],
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        await Promise.all([
          ...session.clips.map((clip) => deleteClipFile(clip.uri)),
          ...session.audioTracks.map((track) => deleteClipFile(track.uri)),
        ]);
      }
      await deleteSessionFiles(sessionId);
      await persist(sessions.filter((s) => s.id !== sessionId));
    },
    [persist, sessions],
  );

  const getSession = useCallback(
    (sessionId: string) => sessions.find((s) => s.id === sessionId),
    [sessions],
  );

  const addClipFromUri = useCallback(
    async (
      sessionId: string,
      sourceUri: string,
      type: Clip['type'],
      durationMs = type === 'image' ? 3000 : 0,
    ) => {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return null;

      const ext = getClipExtension(sourceUri, type);
      const { uri: destUri, filename } = await copyMediaToSession(sessionId, sourceUri, ext);
      let resolvedDuration = durationMs;
      if (type === 'video' && resolvedDuration <= 0) {
        resolvedDuration = await probeVideoDurationMs(destUri);
      }
      const clip = createClip(type, destUri, filename, resolvedDuration);

      const next = sessions.map((s) =>
        s.id === sessionId ? touchSession({ ...s, clips: [...s.clips, clip] }) : s,
      );
      await persist(next);
      return clip;
    },
    [persist, sessions],
  );

  const updateClip = useCallback(
    async (sessionId: string, clipId: string, updates: Partial<Clip>) => {
      const next = sessions.map((s) => {
        if (s.id !== sessionId) return s;
        return touchSession({
          ...s,
          clips: s.clips.map((c) => (c.id === clipId ? { ...c, ...updates } : c)),
        });
      });
      await persist(next);
    },
    [persist, sessions],
  );

  const removeClip = useCallback(
    async (sessionId: string, clipId: string) => {
      const session = sessions.find((s) => s.id === sessionId);
      const clip = session?.clips.find((c) => c.id === clipId);
      if (clip) await deleteClipFile(clip.uri);

      const next = sessions.map((s) =>
        s.id === sessionId
          ? touchSession({ ...s, clips: s.clips.filter((c) => c.id !== clipId) })
          : s,
      );
      await persist(next);
    },
    [persist, sessions],
  );

  const reorderClips = useCallback(
    async (sessionId: string, clipIds: string[]) => {
      const next = sessions.map((s) => {
        if (s.id !== sessionId) return s;
        const map = new Map(s.clips.map((c) => [c.id, c]));
        const reordered = clipIds.map((id) => map.get(id)).filter(Boolean) as Clip[];
        return touchSession({ ...s, clips: reordered });
      });
      await persist(next);
    },
    [persist, sessions],
  );

  const addAudioFromUri = useCallback(
    async (sessionId: string, sourceUri: string, durationMs: number, label: string) => {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return null;

      const ext = getClipExtension(sourceUri, 'video').replace('mp4', 'm4a');
      const safeExt = ['mp3', 'm4a', 'wav', 'aac', 'webm'].includes(ext) ? ext : 'mp3';
      const { uri: destUri, filename } = await copyMediaToSession(sessionId, sourceUri, safeExt);
      const track = createAudioTrack(destUri, filename, durationMs, label);

      const next = sessions.map((s) =>
        s.id === sessionId ? touchSession({ ...s, audioTracks: [...s.audioTracks, track] }) : s,
      );
      await persist(next);
      return track;
    },
    [persist, sessions],
  );

  const removeAudioTrack = useCallback(
    async (sessionId: string, trackId: string) => {
      const session = sessions.find((s) => s.id === sessionId);
      const track = session?.audioTracks.find((t) => t.id === trackId);
      if (track) await deleteClipFile(track.uri);

      const next = sessions.map((s) =>
        s.id === sessionId
          ? touchSession({ ...s, audioTracks: s.audioTracks.filter((t) => t.id !== trackId) })
          : s,
      );
      await persist(next);
    },
    [persist, sessions],
  );

  const splitClip = useCallback(
    async (sessionId: string, clipId: string, splitAtSourceMs: number) => {
      const session = sessions.find((s) => s.id === sessionId);
      const clip = session?.clips.find((c) => c.id === clipId);
      if (!session || !clip || clip.type !== 'video') return;

      const endMs = clip.trimEndMs > 0 ? clip.trimEndMs : clip.durationMs;
      const minGap = 300;
      if (
        splitAtSourceMs <= clip.trimStartMs + minGap ||
        splitAtSourceMs >= endMs - minGap
      ) {
        return;
      }

      const first: Clip = {
        ...clip,
        trimEndMs: splitAtSourceMs,
      };
      const second: Clip = {
        ...clip,
        id: uuidv4(),
        trimStartMs: splitAtSourceMs,
        trimEndMs: endMs,
        textOverlays: [],
        createdAt: new Date().toISOString(),
      };

      const next = sessions.map((s) => {
        if (s.id !== sessionId) return s;
        const index = s.clips.findIndex((c) => c.id === clipId);
        if (index < 0) return s;
        const clips = [...s.clips];
        clips.splice(index, 1, first, second);
        return touchSession({ ...s, clips });
      });
      await persist(next);
    },
    [persist, sessions],
  );

  const value = useMemo(
    () => ({
      sessions,
      loading,
      createNewSession,
      renameSession,
      deleteSession,
      getSession,
      addClipFromUri,
      updateClip,
      removeClip,
      reorderClips,
      addAudioFromUri,
      removeAudioTrack,
      splitClip,
      refresh,
    }),
    [
      sessions,
      loading,
      createNewSession,
      renameSession,
      deleteSession,
      getSession,
      addClipFromUri,
      updateClip,
      removeClip,
      reorderClips,
      addAudioFromUri,
      removeAudioTrack,
      splitClip,
      refresh,
    ],
  );

  return <VlogContext.Provider value={value}>{children}</VlogContext.Provider>;
}

export function useVlog() {
  const ctx = useContext(VlogContext);
  if (!ctx) throw new Error('useVlog must be used within VlogProvider');
  return ctx;
}
