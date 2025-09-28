import { create } from "zustand";

/* 
  https://github.com/pmndrs/zustand
  Global state-management
*/

const useBearStore = create((set) => ({
  appName: undefined,
  setAppName: (state) => set({ appName: state })
}));

export default useBearStore;
