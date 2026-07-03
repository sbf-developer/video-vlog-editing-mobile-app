type RecorderStopResult = {
  uri: string;
  durationMs: number;
};

function pickMimeType(): string {
  const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'video/webm';
}

export class WebMediaRecorder {
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startedAt = 0;
  private autoStopTimer: ReturnType<typeof setTimeout> | null = null;
  private stopPromise: Promise<RecorderStopResult> | null = null;
  private resolveStop: ((result: RecorderStopResult) => void) | null = null;

  constructor(private stream: MediaStream) {}

  start(maxDurationSec: number | null): Promise<RecorderStopResult> {
    this.chunks = [];
    this.startedAt = Date.now();
    const mimeType = pickMimeType();

    this.stopPromise = new Promise((resolve) => {
      this.resolveStop = resolve;
    });

    this.recorder = new MediaRecorder(this.stream, { mimeType });
    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };
    this.recorder.onstop = () => {
      if (this.autoStopTimer) {
        clearTimeout(this.autoStopTimer);
        this.autoStopTimer = null;
      }
      const blob = new Blob(this.chunks, { type: this.recorder?.mimeType ?? 'video/webm' });
      const uri = URL.createObjectURL(blob);
      const durationMs = Date.now() - this.startedAt;
      this.resolveStop?.({ uri, durationMs });
      this.resolveStop = null;
    };

    this.recorder.start(500);

    if (maxDurationSec) {
      this.autoStopTimer = setTimeout(() => this.requestStop(), maxDurationSec * 1000);
    }

    return this.stopPromise;
  }

  requestStop(): void {
    if (this.recorder?.state === 'recording') {
      this.recorder.stop();
    }
  }

  isRecording(): boolean {
    return this.recorder?.state === 'recording';
  }
}

export async function requestWebCameraStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera not supported in this browser.');
  }

  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: 'user' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: true,
  });
}

export function stopWebStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

export function attachStreamToVideo(video: HTMLVideoElement, stream: MediaStream): void {
  video.srcObject = stream;
  video.muted = true;
}
