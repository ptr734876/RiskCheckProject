export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

export interface CheckedDocumentsRequest {
  checkedIds: string[];
}

export interface CheckedAlgorithmsRequest {
  algorithmId: string;
  stepIds: string[];
}

export interface SurveySubmitRequest {
  formData: Record<string, string>;
}

export interface PropertyClickRequest {
  propertyId: number;
  x: number;
  y: number;
}