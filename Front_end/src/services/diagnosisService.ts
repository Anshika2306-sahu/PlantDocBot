import type { DiagnosisResult } from '../types';

const API_URL = 'http://127.0.0.1:8000/diagnose';

/**
 * Sends a FormData object to the local backend and returns the diagnosis.
 * @param formData The FormData object containing text and/or an image file.
 * @returns A promise that resolves to a DiagnosisResult or null.
 */
const postDiagnosisRequest = async (formData: FormData): Promise<DiagnosisResult | null> => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const detail = errorData?.detail || `Server responded with status: ${response.status}`;
            throw new Error(`Failed to get diagnosis. ${detail}`);
        }

        const result: DiagnosisResult = await response.json();
        return result;
    } catch (error) {
        console.error('Error connecting to the local backend:', error);
        // Provide a user-friendly error for common network or CORS issues
        if (error instanceof TypeError) {
             throw new Error('A network error occurred. Please make sure the local backend server is running and accessible.');
        }
        throw error; // Re-throw other errors to be handled by the UI
    }
};

export const diagnosePlantFromImage = async (
  file: File,
  text: string
): Promise<DiagnosisResult | null> => {
  const formData = new FormData();
  formData.append('image', file);
  if (text) {
    formData.append('text', text);
  }
  return postDiagnosisRequest(formData);
};

export const diagnosePlantFromText = async (
    text: string
  ): Promise<DiagnosisResult | null> => {
  const formData = new FormData();
  formData.append('text', text);
  return postDiagnosisRequest(formData);
};
