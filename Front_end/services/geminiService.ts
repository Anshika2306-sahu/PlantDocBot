import { GoogleGenAI, Part, Type } from "@google/genai";
import type { DiagnosisResult } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  // In a real app, you'd want a better way to handle this,
  // but for this environment, we'll rely on the injected variable.
  console.error("API_KEY is not set. Please configure it in your environment.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY! });
const model = "gemini-2.5-flash";

const diagnosisSchema = {
  type: Type.OBJECT,
  properties: {
    disease: {
      type: Type.STRING,
      description: 'The name of the plant disease identified. If no disease is found or the image is unclear, return "Healthy Plant" or "Unknown" respectively.',
    },
    confidence: {
      type: Type.STRING,
      description: 'The confidence level of the diagnosis (e.g., "High", "Medium", "Low").',
    },
    description: {
      type: Type.STRING,
      description: 'A brief, user-friendly description of the disease, its symptoms, and causes.',
    },
    treatment: {
      type: Type.STRING,
      description: 'A step-by-step guide for treating the disease. Use newline characters (\\n) for formatting steps.',
    },
  },
  required: ['disease', 'confidence', 'description', 'treatment'],
};

// Converts a File object to a GoogleGenAI.Part object.
export const fileToGenerativePart = async (file: File): Promise<Part> => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    const data = await base64EncodedDataPromise;
    return {
      inlineData: {
        mimeType: file.type,
        data,
      },
    };
};

export const runDiagnosis = async (userPrompt: Part[], systemInstruction: string): Promise<DiagnosisResult | null> => {
    try {
        // FIX: Replaced usage of deprecated `GenerateContentRequest`.
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: userPrompt },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: diagnosisSchema,
            },
        });
        
        let jsonStr = response.text.trim();
        // The API might wrap the JSON in markdown backticks. Clean it up.
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.substring(7, jsonStr.length - 3);
        } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.substring(3, jsonStr.length - 3);
        }
        
        const diagnosis: DiagnosisResult = JSON.parse(jsonStr);
        return diagnosis;
    } catch (e) {
        console.error("Error calling Gemini API:", e);
        if (e instanceof Error) {
            // Check for API key specific errors
            if (e.message.includes('API key not valid') || e.message.includes('API_KEY_INVALID')) {
               throw new Error('Your API key is invalid or missing. Please check your configuration.');
            }
            // Check for network errors (this is a browser-specific check)
            if (e.message.toLowerCase().includes('failed to fetch')) {
                throw new Error('A network error occurred. Please check your internet connection and try again.');
            }
            // Generic AI model processing error
            throw new Error(`The AI model could not process the request. (Details: ${e.message})`);
        }
        // Fallback for non-Error objects
        throw new Error("An unknown error occurred while communicating with the AI model.");
    }
};
