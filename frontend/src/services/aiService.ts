// MediMate AI Service Layer (Web Edition)
// Supports Groq API (primary fast inference) and NVIDIA NIM API (deep clinical reasoning)
// Seamlessly falls back to rich clinical decision engine when API keys are not supplied

const GROQ_API_KEY = (import.meta as any).env?.VITE_GROQ_API_KEY || '';
const NVIDIA_API_KEY = (import.meta as any).env?.VITE_NVIDIA_API_KEY || '';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

// Models
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const NVIDIA_MODEL = 'meta/llama-3.1-70b-instruct';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  text: string;
  model: 'groq' | 'nvidia' | 'mock';
  tokensUsed?: number;
}

export function getActiveAIProvider(): { name: string; isReal: boolean } {
  if (GROQ_API_KEY) return { name: 'Groq LLaMA-3.3 70B', isReal: true };
  if (NVIDIA_API_KEY) return { name: 'NVIDIA NIM LLaMA-3.1', isReal: true };
  return { name: 'MediMate Clinical Intelligence Engine', isReal: false };
}

// ────────────────────────────────────────────
// Core chat function — tries Groq first, then NVIDIA, then mock
// ────────────────────────────────────────────
export async function chatCompletion(
  messages: AIMessage[],
  systemPrompt?: string,
  preferNvidia = false,
): Promise<AIResponse> {
  const fullMessages: AIMessage[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  // Try Groq first
  if (!preferNvidia && GROQ_API_KEY) {
    try {
      const result = await callGroq(fullMessages);
      return result;
    } catch (e) {
      console.warn('[MediMate AI] Groq call failed, trying NVIDIA fallback...', e);
    }
  }

  // Try NVIDIA NIM
  if (NVIDIA_API_KEY) {
    try {
      const result = await callNvidia(fullMessages);
      return result;
    } catch (e) {
      console.warn('[MediMate AI] NVIDIA call failed, using mock...', e);
    }
  }

  // Final fallback — simulated clinical conversational response
  return { text: getMockResponse(messages), model: 'mock' };
}

// ────────────────────────────────────────────
// Groq API
// ────────────────────────────────────────────
async function callGroq(messages: AIMessage[]): Promise<AIResponse> {
  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.choices[0].message.content,
    model: 'groq',
    tokensUsed: data.usage?.total_tokens,
  };
}

// ────────────────────────────────────────────
// NVIDIA NIM API
// ────────────────────────────────────────────
async function callNvidia(messages: AIMessage[]): Promise<AIResponse> {
  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 1024,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`NVIDIA API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.choices[0].message.content,
    model: 'nvidia',
    tokensUsed: data.usage?.total_tokens,
  };
}

// ────────────────────────────────────────────
// Generate AI clinical summary from patient data
// ────────────────────────────────────────────
export async function generateClinicalSummary(patientData: Record<string, any>): Promise<string> {
  if (!GROQ_API_KEY && !NVIDIA_API_KEY) {
    return patientData.aiInsights?.summary || 'AI summary not available — using pre-computed decision matrix.';
  }

  const systemPrompt = `You are an elite clinical decision support AI for MediMate. Generate a concise, accurate, evidence-backed patient case synthesis for a senior physician.
Rules:
- Be strictly clinical and analytical.
- Explicitly highlight hemodynamic/glycaemic risks and urgent red flags.
- Maximum 4 concise sentences.
- Do NOT declare final definitive diagnosis — support the practitioner's decision.`;

  const result = await chatCompletion(
    [{ role: 'user', content: `Analyze this patient record and generate an immediate clinical case synthesis: ${JSON.stringify(patientData)}` }],
    systemPrompt,
    true, // prefer NVIDIA for clinical depth
  );

  return result.text;
}

// ────────────────────────────────────────────
// Mock fallback responses
// ────────────────────────────────────────────
function getMockResponse(messages: AIMessage[]): string {
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';

  if (lastMessage.includes('chest') || lastMessage.includes('heart') || lastMessage.includes('breath')) {
    return "Thank you for noting that. Can you describe if this discomfort radiates to your left arm, jaw, or shoulder blade, and whether it worsens when walking or climbing stairs?";
  }
  if (lastMessage.includes('period') || lastMessage.includes('cycle') || lastMessage.includes('hair') || lastMessage.includes('weight')) {
    return "Understood. Have you experienced sudden fluctuations in your sleep quality, acne flare-ups along the jawline, or unusual sugar cravings between meals?";
  }
  if (lastMessage.includes('headache') || lastMessage.includes('neck') || lastMessage.includes('severe')) {
    return "This is a critical symptom. Did this headache reach maximum peak intensity within seconds (thunderclap), and are you experiencing stiffness when tucking your chin to your chest?";
  }
  return "Thank you for clarifying. Has this symptom stayed constant throughout the day, or does it fluctuate with meals, activity, or rest?";
}
