import { cleanJsonText, tryParseJson } from './json';

export async function runOpenAIJson(prompt, system = 'Return valid JSON only.') {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      temperature: 0.35
    })
  });

  const text = await response.text();
  const data = tryParseJson(text);
  if (!response.ok || !data) throw new Error(`OpenAI failed: ${text}`);

  const content = data?.choices?.[0]?.message?.content || '{}';
  const parsed = tryParseJson(cleanJsonText(content));
  if (!parsed) throw new Error(`OpenAI returned invalid JSON: ${content}`);
  return parsed;
}

export async function runAnthropicJson(prompt) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('Missing ANTHROPIC_API_KEY');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
      max_tokens: 1800,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const text = await response.text();
  const data = tryParseJson(text);
  if (!response.ok || !data) throw new Error(`Anthropic failed: ${text}`);

  const content = data?.content?.[0]?.text || '{}';
  const parsed = tryParseJson(cleanJsonText(content));
  if (!parsed) throw new Error(`Anthropic returned invalid JSON: ${content}`);
  return parsed;
}
