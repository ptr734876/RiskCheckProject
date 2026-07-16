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
  latitude: number | null;
  longitude: number | null;
  address: string;
  type: string;
  area: string;
  source?: string;
  legal: {
    public: LegalItem[];
    private: LegalItem[];
  };
  surroundings: SurroundingItem[];
}

// Documents
export interface DocumentSource {
  id: string;
  title: string;
  downloadHeader: string;
}

export interface DocumentItem {
  id?: number;
  code?: string;
  title: string;
  note: string[];
  required: boolean;
  sourceId: string;
  algorithmId: string | null;
  articleId: string | null;
  collected?: boolean;
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
  id: string;
  displayTitle: string;
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

export interface AlgorithmGroup {
  id: string;
  title: string;
  algorithms: AlgorithmConfig[];
}

// Helpful Articles

export interface TextElement {
  type: 'text' | 'link';
  content: string;
  linkId?: string;
  linkType?: 'algorithm' | 'helpful' | 'step1' | 'step2' | 'external';
  linkLabel?: string;
  linkUrl?: string;
}

export interface ContentBlock {
  type: 'paragraph' | 'list' | 'highlight' | 'bullet-list';
  elements: TextElement[];
}

export interface ArticleManifest {
  id: string;
  title: string;
  description: string;
  keyPoints: string[];
  fileName: string;
}

export interface ArticlesManifestFile {
  generatedAt: string;
  articles: ArticleManifest[];
}

export interface HelpfulArticle {
  id: string;
  title: string;
  description: string;
  keyPoints: string[];
  content: ContentBlock[];
}

export interface PlaceItem {
  name: string;
  address: string;
  time: string;
  distance: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface PlaceCategory {
  id: string;
  title: string;
  subtitle: string;
  places: PlaceItem[];
}

export type MfcLocation = PlaceItem & { type?: 'property' | 'user' };

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
