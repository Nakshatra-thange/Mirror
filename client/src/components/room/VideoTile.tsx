import { useEffect, useRef } from "react";

interface Props {
  streamRef:  React.MutableRefObject<HTMLVideoElement | null>;
  label:      string;
  muted?:     boolean;       // always mute self-view
  audioOn:    boolean;
  videoOn:    boolean;
  connected?: boolean;
  isLocal?:   boolean;
}

export default function VideoTile({
  streamRef, label, muted = false, audioOn, videoOn, connected = true, isLocal = false,
}: Props) {
  const videoEl = useRef<HTMLVideoElement>(null);

  // Wire ref from hook → actual DOM element
  useEffect(() => {
    streamRef.current = videoEl.current;
  }, [streamRef]);

  return (
    <div className="relative bg-zinc-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
      {/* Video element */}
      <video
        ref={videoEl}
        autoPlay
        playsInline
        muted={muted}
        className={`w-full h-full object-cover transition-opacity duration-300
          ${videoOn && connected ? "opacity-100" : "opacity-0"}`}
      />

      {/* Avatar fallback when video off or not connected */}
      {(!videoOn || !connected) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-lg font-bold text-zinc-300">
            {label[0]?.toUpperCase()}
          </div>
          {!connected && !isLocal && (
            <p className="text-zinc-600 text-xs">Waiting for peer...</p>
          )}
        </div>
      )}

      {/* Label + status row */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5
                      bg-gradient-to-t from-black/70 to-transparent
                      flex items-center justify-between">
        <span className="text-xs text-zinc-300 font-medium">{label}</span>
        <div className="flex items-center gap-1">
          {!audioOn && (
            <span className="text-xs bg-red-500/80 text-white px-1.5 py-0.5 rounded">
              🔇
            </span>
          )}
          {!videoOn && (
            <span className="text-xs bg-zinc-700/80 text-zinc-300 px-1.5 py-0.5 rounded">
              📷 off
            </span>
          )}
        </div>
      </div>
    </div>
  );
}