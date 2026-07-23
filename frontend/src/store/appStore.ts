import { create } from 'zustand';

export interface SelectedLocation {
  address: string;
  latitude: number;
  longitude: number;
}

interface AppState {
  activeStep: number;
  selectedLocation: SelectedLocation | null;
  sidebarCollapsed: boolean;
  isSurveyCompleted: boolean;
  surveyFormData: Record<string, string>;
  checkedDocuments: string[];
  checkedAlgorithms: Record<string, string[]>;
  
  setActiveStep: (step: number) => void;
  setSelectedLocation: (location: SelectedLocation | null) => void;
  toggleSidebar: () => void;
  setSurveyCompleted: (completed: boolean) => void;
  setSurveyFormData: (data: Record<string, string>) => void;
  toggleDocument: (docId: string) => void;
  setCheckedDocuments: (ids: string[]) => void;
  toggleAlgorithmStep: (algorithmId: string, stepId: string) => void;
  setCheckedAlgorithmSteps: (algorithmId: string, stepIds: string[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeStep: 0,
  selectedLocation: null,
  sidebarCollapsed: false,
  isSurveyCompleted: false,
  surveyFormData: {},
  checkedDocuments: [],
  checkedAlgorithms: {},

  setActiveStep: (step) => set({ activeStep: step }),
  setSelectedLocation: (location) => set({ selectedLocation: location }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSurveyCompleted: (completed) => set({ isSurveyCompleted: completed }),
  setSurveyFormData: (data) => set({ surveyFormData: data }),
  
  toggleDocument: (docId) => set((state) => {
    const docs = state.checkedDocuments.includes(docId)
      ? state.checkedDocuments.filter(id => id !== docId)
      : [...state.checkedDocuments, docId];
    return { checkedDocuments: docs };
  }),

  setCheckedDocuments: (ids) => set({ checkedDocuments: ids }),
  
  toggleAlgorithmStep: (algorithmId, stepId) => set((state) => {
    const currentSteps = state.checkedAlgorithms[algorithmId] || [];
    const newSteps = currentSteps.includes(stepId)
      ? currentSteps.filter(id => id !== stepId)
      : [...currentSteps, stepId];
    return {
      checkedAlgorithms: {
        ...state.checkedAlgorithms,
        [algorithmId]: newSteps,
      },
    };
  }),

  setCheckedAlgorithmSteps: (algorithmId, stepIds) => set((state) => ({
    checkedAlgorithms: {
      ...state.checkedAlgorithms,
      [algorithmId]: stepIds,
    },
  })),
}));