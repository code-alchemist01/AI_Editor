import { create } from 'zustand';
import { FileRecord } from '@/types';

interface FileState {
  files: FileRecord[];
  selectedFile: FileRecord | null;
  setFiles: (files: FileRecord[]) => void;
  addFile: (file: FileRecord) => void;
  removeFile: (id: string) => void;
  setSelectedFile: (file: FileRecord | null) => void;
  updateFile: (id: string, updates: Partial<FileRecord>) => void;
}

export const useFileStore = create<FileState>((set) => ({
  files: [],
  selectedFile: null,
  setFiles: (files) => set({ files }),
  addFile: (file) => set((state) => ({ files: [...state.files, file] })),
  removeFile: (id) => set((state) => ({ files: state.files.filter((f) => f.id !== id) })),
  setSelectedFile: (file) => set({ selectedFile: file }),
  updateFile: (id, updates) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    })),
}));
