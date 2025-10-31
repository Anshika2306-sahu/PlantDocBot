import type { DiagnosisResult } from '../types';

// Mocked diagnosis data. This simulates what a sophisticated, offline model would return.
const mockDiagnosis: DiagnosisResult = {
  disease: "Tomato Early Blight",
  confidence: "High",
  description: "A fungal disease caused by Alternaria solani. It's characterized by dark, concentric 'bulls-eye' shaped spots on lower leaves. Affected leaves eventually turn yellow, wither, and die.",
  treatment: "1. Cultural Practices: Use disease-resistant varieties if possible. Mulch around the base of plants to prevent soil containing spores from splashing onto leaves.\n2. Watering: Water at the base of the plant (e.g., with a soaker hose) to keep foliage dry.\n3. Fungicides: Apply fungicides containing chlorothalonil or mancozeb at the first sign of disease. Repeat every 7-10 days."
};

const mockHealthyDiagnosis: DiagnosisResult = {
  disease: "Healthy Plant",
  confidence: "High",
  description: "The plant appears to be in excellent health, showing vigorous growth with no visible signs of disease, pests, or nutrient deficiencies.",
  treatment: "1. Maintain Care: Continue with your current watering schedule and feeding regimen.\n2. Monitor: Regularly inspect leaves (top and bottom) and stems for any early signs of trouble.\n3. Environment: Ensure the plant continues to receive adequate sunlight, air circulation, and space to grow."
};

// This function simulates a local model processing the request.
const runLocalDiagnosis = (text: string): Promise<DiagnosisResult | null> => {
  console.log(`Running local diagnosis for prompt: "${text}"`);
  return new Promise(resolve => {
    setTimeout(() => {
      // A simple heuristic to make the mock slightly interactive.
      if (text && text.toLowerCase().includes('healthy')) {
        resolve(mockHealthyDiagnosis);
      } else {
        resolve(mockDiagnosis);
      }
    }, 1500); // Simulate processing time.
  });
};


export const diagnosePlantFromImage = async (
  file: File,
  text: string
): Promise<DiagnosisResult | null> => {
  // Validate file type and size before processing
  const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  const maxSize = 10 * 1024 * 1024; // 10 MB

  if (!supportedTypes.includes(file.type)) {
    throw new Error(`Invalid image format. Please upload a JPEG, PNG, WEBP, or HEIC image.`);
  }

  if (file.size > maxSize) {
    throw new Error(`Image is too large. Please upload an image smaller than 10MB.`);
  }

  const formData = new FormData();
  formData.append('image', file);
  if (text) {
    formData.append('text', text);
  }

  try {
    const response = await fetch('http://localhost:8000/diagnose', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as DiagnosisResult;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const diagnosePlantFromText = async (
    text: string
  ): Promise<DiagnosisResult | null> => {
  const formData = new FormData();
  formData.append('text', text);

  try {
    const response = await fetch('http://localhost:8000/diagnose', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as DiagnosisResult;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
