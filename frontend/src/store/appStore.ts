import { create } from 'zustand';

interface AppState {
  activeStep: number;
  sidebarCollapsed: boolean;
  isSurveyCompleted: boolean;
  surveyFormData: Record<string, string>;
  checkedDocuments: string[];
  checkedAlgorithms: Record<string, string[]>;
  
  setActiveStep: (step: number) => void;
  toggleSidebar: () => void;
  setSurveyCompleted: (completed: boolean) => void;
  setSurveyFormData: (data: Record<string, string>) => void;
  toggleDocument: (docId: string) => void;
  toggleAlgorithmStep: (algorithmId: string, stepId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeStep: 0,
  sidebarCollapsed: false,
  isSurveyCompleted: false,
  surveyFormData: {},
  checkedDocuments: [],
  checkedAlgorithms: {},

  setActiveStep: (step) => set({ activeStep: step }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSurveyCompleted: (completed) => set({ isSurveyCompleted: completed }),
  setSurveyFormData: (data) => set({ surveyFormData: data }),
  
  toggleDocument: (docId) => set((state) => {
    const docs = state.checkedDocuments.includes(docId)
      ? state.checkedDocuments.filter(id => id !== docId)
      : [...state.checkedDocuments, docId];
    return { checkedDocuments: docs };
  }),
  
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
}));