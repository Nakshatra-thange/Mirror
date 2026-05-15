import { create } from "zustand";
import type { LanguageValue } from "../constants/languages";

interface EditorState {
  code: string;
  language: LanguageValue;
  setCode: (code: string) => void;
  setLanguage: (lang: LanguageValue) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  code: "",
  language: "javascript",
  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
}));