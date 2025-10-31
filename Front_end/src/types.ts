
export interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  image?: string;
  isDiagnosis?: boolean;
  diagnosis?: DiagnosisResult | null;
  // QA/Ask responses (rendered with AnswerCard)
  isAnswer?: boolean;
  answerText?: string;
  answerDetail?: string;
  answerSources?: string[];
  // optional unix ms timestamp for ordering / display
  timestamp?: number;
}

export interface DiagnosisResult {
  disease: string;
  confidence: string;
  description: string;
  treatment: string;
}
