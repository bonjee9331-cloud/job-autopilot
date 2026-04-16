import { fetchWithTimeout } from './jobs/fetchWithTimeout';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PRIMARY_LLM = process.env.PRIMARY_LLM || 'openai';
const SECONDARY_LLM = process.env.SECONDARY_LLM || 'anthropic';
const BRAIN_MODE = process.env.BRAIN_MODE || 'dual';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
const ANTHROPIC_VERSION = process.env.ANTHROPIC_VERSION || '2023-06-01';
const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS || 30000);

async function callOpenAI(prompt) {
  if (!OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  const response = await fetchWithTimeout(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert job application assistant. You analyze job descriptions, extract keywords, tailor resumes without inventing experience, and write sharp, human cover letters.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4
      })
    },
    LLM_TIMEOUT_MS
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${errorText.slice(0, 300)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callAnthropic(prompt) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Missing ANTHROPIC_API_KEY');
  }

  const response = await fetchWithTimeout(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': ANTHROPIC_VERSION
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 2000,
        temperature: 0.4,
        system:
          'You are an expert job application assistant. Improve job-fit analysis, refine resume tailoring, and polish cover letters so they sound natural, credible, and strong.',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    },
    LLM_TIMEOUT_MS
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic error ${response.status}: ${errorText.slice(0, 300)}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

export async function runPrimaryBrain(prompt) {
  if (PRIMARY_LLM === 'anthropic') {
    return callAnthropic(prompt);
  }
  return callOpenAI(prompt);
}

export async function runSecondaryBrain(prompt) {
  if (SECONDARY_LLM === 'openai') {
    return callOpenAI(prompt);
  }
  return callAnthropic(prompt);
}

function safeParseJson(text) {
  if (!text || typeof text !== 'string') return null;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function runBrain(prompt) {
  const primaryResult = await runPrimaryBrain(prompt);

  if (BRAIN_MODE !== 'dual') {
    return {
      primary: primaryResult,
      secondary: null,
      final: primaryResult
    };
  }

  const critiquePrompt = `
You are reviewing a JSON response for a job application workflow.

IMPORTANT:
- You MUST return valid JSON
- Do NOT add explanations
- Do NOT add text outside JSON
- Do NOT change the structure

Here is the JSON to improve:
${primaryResult}

Improve wording, clarity, and strength while keeping EXACT same JSON structure.

Return ONLY valid JSON.
`;

  let secondaryResult = null;
  try {
    secondaryResult = await runSecondaryBrain(critiquePrompt);
  } catch (err) {
    console.error('[runBrain] secondary brain failed:', err.message);
  }

  const secondaryParsed = safeParseJson(secondaryResult);
  const primaryParsed = safeParseJson(primaryResult);
  const final = secondaryParsed
    ? secondaryResult
    : primaryParsed
      ? primaryResult
      : primaryResult;

  return {
    primary: primaryResult,
    secondary: secondaryResult,
    final
  };
}
