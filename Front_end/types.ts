
export interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  image?: string;
  isDiagnosis?: boolean;
  diagnosis?: DiagnosisResult | null;
}

export interface DiagnosisResult {
  disease: string;
  confidence: string;
  description: string;
  treatment: string;
}
