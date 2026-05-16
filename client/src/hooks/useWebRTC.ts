import { useEffect, useRef, useState, useCallback } from "react";
import { socket } from "../lib/socket";

interface TrackState {
  audio: boolean;
  video: boolean;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useWebRTC(roomCode: string) {
  const localStreamRef  = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pcRef           = useRef<RTCPeerConnection | null>(null);
  const localVideoRef   = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef  = useRef<HTMLVideoElement | null>(null);

  const [localTrackState,  setLocalTrackState]  = useState<TrackState>({ audio: true,  video: true  });
  const [remoteTrackState, setRemoteTrackState] = useState<TrackState>({ audio: true,  video: true  });
  const [connected,   setConnected]   = useState(false);
  const [mediaError,  setMediaError]  = useState<string | null>(null);
  const [peerPresent, setPeerPresent] = useState(false);

  // ── Create peer connection ────────────────────────────
  function createPC() {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("webrtc:ice_candidate", { roomCode, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      const [remoteStream] = e.streams;
      remoteStreamRef.current = remoteStream;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      setConnected(true);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        setConnected(false);
      }
    };

    pcRef.current = pc;
    return pc;
  }

  // ── Get local media ───────────────────────────────────
  async function getLocalMedia(): Promise<MediaStream | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setMediaError(null);
      return stream;
    } catch {
      // Try audio only
      try {
        const audioOnly = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        localStreamRef.current = audioOnly;
        setLocalTrackState(s => ({ ...s, video: false }));
        setMediaError("Camera not available — audio only");
        return audioOnly;
      } catch {
        setMediaError("No camera or microphone found");
        return null;
      }
    }
  }

  // ── Add tracks to peer connection ─────────────────────
  function addTracksToPc(pc: RTCPeerConnection, stream: MediaStream) {
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
  }

  // ── Initiate call (called by whoever sees peer_ready first) ──
  const startCall = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream || !pcRef.current) return;

    addTracksToPc(pcRef.current, stream);
    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);
    socket.emit("webrtc:offer", { roomCode, offer });
  }, [roomCode]);

  // ── Toggle audio ──────────────────────────────────────
  const toggleAudio = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const enabled = !localTrackState.audio;
    stream.getAudioTracks().forEach(t => { t.enabled = enabled; });
    setLocalTrackState(s => ({ ...s, audio: enabled }));
    socket.emit("webrtc:track_state", { roomCode, audio: enabled, video: localTrackState.video });
  }, [localTrackState, roomCode]);

  // ── Toggle video ──────────────────────────────────────
  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const enabled = !localTrackState.video;
    stream.getVideoTracks().forEach(t => { t.enabled = enabled; });
    setLocalTrackState(s => ({ ...s, video: enabled }));
    socket.emit("webrtc:track_state", { roomCode, audio: localTrackState.audio, video: enabled });
  }, [localTrackState, roomCode]);

  // ── Main setup effect ─────────────────────────────────
  useEffect(() => {
    if (!roomCode) return;

    let pc = createPC();

    async function init() {
      const stream = await getLocalMedia();
      if (!stream) return;

      // Signal that we're ready
      socket.emit("webrtc:ready", { roomCode });
    }

    // ── Signaling handlers ────────────────────────────
    socket.on("webrtc:peer_ready", async () => {
      setPeerPresent(true);
      // We initiate the offer
      if (!localStreamRef.current) return;
      addTracksToPc(pc, localStreamRef.current);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("webrtc:offer", { roomCode, offer });
    });

    socket.on("webrtc:offer", async ({ offer }) => {
      setPeerPresent(true);
      if (!localStreamRef.current) return;
      addTracksToPc(pc, localStreamRef.current);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc:answer", { roomCode, answer });
    });

    socket.on("webrtc:answer", async ({ answer }) => {
      if (pc.signalingState !== "have-local-offer") return;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("webrtc:ice_candidate", async ({ candidate }) => {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // ignore stale candidates
      }
    });

    socket.on("webrtc:track_state", ({ audio, video }) => {
      setRemoteTrackState({ audio, video });
    });

    // Peer left — clean up remote video
    socket.on("room:user_left", () => {
      setConnected(false);
      setPeerPresent(false);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      // Rebuild PC ready for reconnect
      pc.close();
      pc = createPC();
    });

    init();

    return () => {
      socket.off("webrtc:peer_ready");
      socket.off("webrtc:offer");
      socket.off("webrtc:answer");
      socket.off("webrtc:ice_candidate");
      socket.off("webrtc:track_state");
      socket.off("room:user_left");

      localStreamRef.current?.getTracks().forEach(t => t.stop());
      pc.close();
    };
  }, [roomCode]);

  return {
    localVideoRef,
    remoteVideoRef,
    localTrackState,
    remoteTrackState,
    connected,
    peerPresent,
    mediaError,
    toggleAudio,
    toggleVideo,
  };
}