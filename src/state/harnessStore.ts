import { create } from "zustand";

export type HarnessEnvironment = "ready" | "checking";

export interface HarnessState {
  environment: HarnessEnvironment;
  setEnvironment: (environment: HarnessEnvironment) => void;
}

export const useHarnessStore = create<HarnessState>((set) => ({
  environment: "ready",
  setEnvironment: (environment) => set({ environment }),
}));
