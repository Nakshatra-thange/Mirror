import { create } from "zustand";

export type SessionRole = "INTERVIEWER" | "CANDIDATE";

interface RoomUser {
  userId: string;
  name: string;
  role: string;
}

interface RoomState {
  roomCode: string | null;
  roomTitle: string | null;
  sessionRole: SessionRole | null;
  participants: RoomUser[];
  setRoom: (code: string, title: string, role: SessionRole) => void;
  setParticipants: (p: RoomUser[]) => void;
  clearRoom: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  roomCode: null,
  roomTitle: null,
  sessionRole: null,
  participants: [],
  setRoom: (roomCode, roomTitle, sessionRole) => set({ roomCode, roomTitle, sessionRole }),
  setParticipants: (participants) => set({ participants }),
  clearRoom: () => set({ roomCode: null, roomTitle: null, sessionRole: null, participants: [] }),
}));