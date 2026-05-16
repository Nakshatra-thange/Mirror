import { useRoomStore } from "../store/room";
import { useAuthStore } from "../store/auth";

export function useRole(){
    const sessionRole = useRoomStore(s=>sessionRole);
    const user = useAuthStore(s => s.user);

    return {
        isInterviewer: sessionRole === "INTERVIEWER",
        isCandidate: sessionRole === "CANDIDATE",
        sessionRole,
        user,
      };
    

}