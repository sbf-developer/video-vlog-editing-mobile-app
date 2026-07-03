import { ClipPlayer } from '@/components/ClipPlayer';
import type { Clip } from '@/lib/types';

type ClipPreviewProps = {
  clip: Clip;
  autoPlay?: boolean;
  showControls?: boolean;
  onTimeUpdate?: (sourceMs: number) => void;
};

export function ClipPreview({
  clip,
  autoPlay = false,
  showControls = true,
  onTimeUpdate,
}: ClipPreviewProps) {
  return (
    <ClipPlayer
      clip={clip}
      autoPlay={autoPlay}
      showControls={showControls}
      onTimeUpdate={onTimeUpdate}
    />
  );
}
