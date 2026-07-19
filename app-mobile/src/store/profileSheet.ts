import { create } from 'zustand';

type ProfileSheetState = {
  visible: boolean;
  open: () => void;
  close: () => void;
};

export const useProfileSheet = create<ProfileSheetState>((set) => ({
  visible: false,
  open: () => set({ visible: true }),
  close: () => set({ visible: false }),
}));
