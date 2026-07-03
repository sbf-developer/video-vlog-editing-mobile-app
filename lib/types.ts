export type ClipType = 'video' | 'image';

export type TextOverlay = {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
};

export type AudioTrack = {
  id: string;
  uri: string;
  filename: string;
  durationMs: number;
  label: string;
};

export type Clip = {
  id: string;
  type: ClipType;
  uri: string;
  filename: string;
  durationMs: number;
  trimStartMs: number;
  trimEndMs: number;
  textOverlays: TextOverlay[];
  createdAt: string;
};

export type VlogSession = {
  id: string;
  name: string;
  clips: Clip[];
  audioTracks: AudioTrack[];
  createdAt: string;
  updatedAt: string;
};

export type CaptureSettings = {
  maxDurationSec: number;
};

export const DEFAULT_CAPTURE_DURATION_SEC = 3;
