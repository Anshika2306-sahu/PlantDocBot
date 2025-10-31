const API_URL = 'http://127.0.0.1:8000/ask';

export interface AskResponse {
  source: string;
  answer?: string;
  detail?: string;
}

export const askQuestion = async (question: string): Promise<AskResponse> => {
  try {
    const form = new FormData();
    form.append('question', question);

    // Debug: log outgoing question (helps to correlate frontend -> backend requests)
    console.debug('[askService] sending question:', question);

    const res = await fetch(API_URL, {
      method: 'POST',
      body: form,
    });

    // Capture response body for richer logging
    const contentType = res.headers.get('content-type') || '';
    let data: any = null;
    try {
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        // If not JSON, still read text for debugging
        data = { text: await res.text() };
      }
    } catch (parseErr) {
      console.error('[askService] failed to parse response body', parseErr);
      data = { parseError: String(parseErr) };
    }

    if (!res.ok) {
      console.error('[askService] non-ok response', res.status, data);
      throw new Error(`Server responded with ${res.status}: ${JSON.stringify(data)}`);
    }

    console.debug('[askService] response data:', data);
    return data as AskResponse;
  } catch (e) {
    console.error('[askService] askQuestion error', e);
    // rethrow so calling code can decide how to handle and show UI messages
    throw e instanceof Error ? e : new Error('Failed to contact local QA service.');
  }
};
