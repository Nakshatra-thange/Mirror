import VideoTile from "./VideoTile";
import { useWebRTC } from "../../hooks/useWebRTC";

interface Props {
  roomCode: string;
  userName: string;
}

export default function VideoPanel({ roomCode, userName }: Props) {
  const {
    localVideoRef,
    remoteVideoRef,
    localTrackState,
    remoteTrackState,
    connected,
    peerPresent,
    mediaError,
    toggleAudio,
    toggleVideo,
  } = useWebRTC(roomCode);

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Error banner */}
      {mediaError && (
        <div className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20
                        rounded-lg px-3 py-2">
          ⚠ {mediaError}
        </div>
      )}

      {/* Remote video */}
      <VideoTile
        streamRef={remoteVideoRef}
        label="Peer"
        muted={false}
        audioOn={remoteTrackState.audio}
        videoOn={remoteTrackState.video}
        connected={connected}
      />

      {/* Local video — self view */}
      <VideoTile
        streamRef={localVideoRef}
        label={userName}
        muted={true}
        audioOn={localTrackState.audio}
        videoOn={localTrackState.video}
        connected={true}
        isLocal={true}
      />

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 pt-1">
        <button
          onClick={toggleAudio}
          className={`w-10 h-10 rounded-full flex items-center justify-center
                      text-sm transition-all border
                      ${localTrackState.audio
                        ? "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                        : "bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"}`}>
          {localTrackState.audio ? "🎙" : "🔇"}
        </button>

        <button
          onClick={toggleVideo}
          className={`w-10 h-10 rounded-full flex items-center justify-center
                      text-sm transition-all border
                      ${localTrackState.video
                        ? "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                        : "bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"}`}>
          {localTrackState.video ? "📷" : "🚫"}
        </button>

        {/* Connection status dot */}
        <div className={`flex items-center gap-1.5 ml-2 text-xs
          ${connected ? "text-green-400" : peerPresent ? "text-yellow-400" : "text-zinc-600"}`}>
          <span className={`w-2 h-2 rounded-full
            ${connected ? "bg-green-400" : peerPresent ? "bg-yellow-400 animate-pulse" : "bg-zinc-700"}`} />
          {connected ? "Connected" : peerPresent ? "Connecting..." : "No peer yet"}
        </div>
      </div>
    </div>
  );
}