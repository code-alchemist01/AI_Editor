import { create } from 'zustand';
import { CreatorMode } from '@/types';

interface ModeState {
  currentMode: CreatorMode;
  setMode: (mode: CreatorMode) => void;
}

export const useModeStore = create<ModeState>((set) => ({
  currentMode: CreatorMode.CHAT,
  setMode: (mode) => set({ currentMode: mode }),
}));
