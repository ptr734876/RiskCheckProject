// User 
export interface User {
  id: string;
  email: string;
  fullName: string;
  isAuthenticated: boolean;
  isGuest: boolean;
}

// Property
export interface LegalItem {
  label: string;
  value: string;
  tip?: string;
  impact?: string;
  link?: { type: 'helpful' | 'algorithm'; id: string } | null;
}

export interface SurroundingItem {
  text: string;
  type: 'plus' | 'minus';
  impact: string;
  tip: string;
  link: { type: 'helpful' | 'algorithm'; id: string } | null;
}

export interface Property {
  id: number;
  x: number;
  y: number;
  address: string;
  type: string;
  area: string;
  legal: {
    public: LegalItem[];
    private: LegalItem[];
  };
  surroundings: SurroundingItem[];
}

// Documents
export interface DocumentItem {
  title: string;
  note: string[];
  required: boolean;
  algorithmId: string | null;
  articleId: string | null;
}

// Algorithms 

export interface AlgorithmStep {
  id: string;
  text: string;
  description?: string;
  isSubStep?: boolean;  
  link?: {
    type: 'algorithm' | 'helpful' | 'step1' | 'step2' | 'external';
    id: string;
    label: string;
    url?: string;
  } | null;
}

export interface AlgorithmToggle {
  id: string;
  label: string;
}

export interface AlgorithmConfig {
  title: string;
  subtitle?: string;
  steps: AlgorithmStep[];
  toggle?: {
    left: AlgorithmToggle;
    right: AlgorithmToggle;
    middle1?: AlgorithmToggle;
    middle2?: AlgorithmToggle;
    middle3?: AlgorithmToggle;
  };
}

// Helpful Articles
export interface HelpfulArticle {
  id: string;
  title: string;
  description: string;
  keyPoints: string[];
  content: string[];
}

// MFC
export interface MfcLocation {
  name: string;
  address: string;
  time: string;
  distance: string;
  type: 'property' | 'user';
}

// Survey
export interface SurveyQuestion {
  id: string;
  label: string;
  type: 'radio';
  options: { value: string; label: string }[];
  tip: string | null;
  links: { type: 'algorithm' | 'helpful'; id: string; label: string }[] | null;
  condition?: {
    questionId: string;
    value: string;
  };
}

export interface SurveyStep {
  id: number;
  title: string;
  subtitle: string;
  questions: SurveyQuestion[];
}

export interface LegalDocument {
  title: string;
  subtitle: string;
  fileName: string;
  content: string[];
}