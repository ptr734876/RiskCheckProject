import { create } from 'zustand';

export type BackRoute = {
  path: string;
  label: string;
} | null;

interface NavigationState {
  materialsBackRoute: BackRoute;
  algorithmsBackRoute: BackRoute;

  setMaterialsBackRoute: (route: BackRoute) => void;
  setAlgorithmsBackRoute: (route: BackRoute) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  materialsBackRoute: null,
  algorithmsBackRoute: null,

  setMaterialsBackRoute: (route) => set({ materialsBackRoute: route }),
  setAlgorithmsBackRoute: (route) => set({ algorithmsBackRoute: route }),
}));