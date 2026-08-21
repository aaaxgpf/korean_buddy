/**
 * Direct Client-Side Gemini API Client
 * Executes browser-to-Gemini Fetch requests directly without backend proxy.
 */

import { ChatMessage } from '../types';

export interface DirectGeminiConfig {
  apiKey: string;
  model?: string;
  baseURL?: string;
}

export interface DirectChatParams {
  apiKey: string;
  model?: string;
  baseURL?: string;
  character: any;
  messages: ChatMessage[];
  userNickname?: string;
  userName?: string;
  userCallSign?: string;
  languageMode?: string;
  imageBase64?: string;
  imageMime?: string;
  clientTemporal?: any;
}

/**
 * Direct Gemini Connection Test in Browser
 */
export async function directTestGeminiConnection(config: DirectGeminiConfig): Promise<{ ok: boolean; message: string; raw?: any }> {
  const cleanKey = (config.apiKey || '').replace(/[^\x00-\x7F]/g, '').trim();
  if (!cleanKey) {
    throw new Error('请先填入有效的 Google Gemini API Key');
  }

  const model = (config.model?.trim() || 'gemini-3.7-flash').replace(/^models\//, '');
  const baseURL = (config.baseURL?.trim() || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '');
  const url = `${baseURL}/models/${model}:generateContent?key=${encodeURIComponent(cleanKey)}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-goog-api-key': cleanKey
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: 'Hello' }]
        }
      ]
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '안녕하세요! API 연결이 성공적으로 완료되었습니다.';

  return {
    ok: true,
    message: '连接成功！已通过前端直连 Google Gemini 官方端点',
    raw: replyText
  };
}

/**
 * Direct Gemini Multi-turn Chat in Browser
 */
export async function directSendGeminiChat(params: DirectChatParams): Promise<any> {
  const cleanKey = (params.apiKey || '').replace(/[^\x00-\x7F]/g, '').trim();
  if (!cleanKey) {
    throw new Error('NO_API_KEY');
  }

  const model = (params.model?.trim() || 'gemini-3.7-flash').replace(/^models\//, '');
  const baseURL = (params.baseURL?.trim() || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '');
  const url = `${baseURL}/models/${model}:generateContent?key=${encodeURIComponent(cleanKey)}`;

  const character = params.character;
  const userName = params.userName || params.userNickname || '사용자';
  const userCallSign = params.userCallSign || params.userNickname || character?.userNickname || '너';

  const personalityTraits = Array.isArray(character?.personality_traits)
    ? character.personality_traits.map((t: string) => `- ${t}`).join('\n')
    : '';

  const systemPrompt = `[System Instruction: You are roleplaying as Korean idols in 'Korean Buddy', a Korean learning and companion app. Always strictly adhere to the character's real-life personality, vocal tone, and speaking habits. Never use greasy, over-the-top K-drama tropes or aggressive/domineering tones. Respond naturally in daily conversational Korean suited to the character's age, MBTI, and background.]

${character?.system_prompt ? `[Character Directive]\n${character.system_prompt}` : `[Character: ${character?.name_kr || character?.name_ko || '김선우'}] (${character?.group || 'THE BOYZ'})`}

${personalityTraits ? `[Personality Traits]\n${personalityTraits}` : ''}
${character?.tone_style ? `[Tone & Style Directive]\n${character.tone_style}` : ''}
[User Info: 用户的名字是 ${userName}，角色对用户的专属称谓/称呼是「${userCallSign}」，请在日常对话中自然地使用「${userCallSign}」称呼对方]
[Context: Private 1-on-1 real-time chat with close friend / fan (${userCallSign}). Current Time: ${new Date().toISOString()}]

CORE CONVERSATIONAL DIRECTIVES:
- Language: "korean_text" MUST be 100% pure Korean suited to the character's personality, age, MBTI and tone.
- Natural Persona: Address the user naturally with their call sign「${userCallSign}」or natural informal/polite speech matching your role.
- Never use greasy, over-the-top K-drama tropes, cheesy lines, or domineering/aggressive tones.
- "translation_text": Natural, colloquial Simplified Chinese translation.
- If user speaks in Chinese, Korean or English, respond naturally in pure Korean in character!

OUTPUT STRICT JSON ONLY:
{
  "korean_text": "순수 한국어 답변",
  "korean": "순수 한국어 답변",
  "translation_text": "自然地道的简体中文翻译",
  "translation_zh": "自然地道的简体中文翻译",
  "translation_en": "Natural English translation",
  "tts_audio_text": "순수 한국어 발음 텍스트",
  "vocabulary": [
    {
      "word": "원형/단어",
      "hangul": "한글",
      "type": "품사",
      "meaning_zh": "中文精准释义",
      "example_ko": "예문",
      "example_zh": "예문 번역"
    }
  ],
  "grammar_points": [
    {
      "pattern": "문법",
      "title_zh": "语法名",
      "explanation_zh": "用法讲解"
    }
  ],
  "learning_tip": "角色专属口语小建议"
}`;

  // Build history contents
  const contents: any[] = [];

  const historyMessages = (params.messages || []).slice(-10);
  for (const m of historyMessages) {
    const role = m.role === 'user' ? 'user' : 'model';
    const parts: any[] = [];

    if (m.role === 'user' && params.imageBase64 && m === historyMessages[historyMessages.length - 1]) {
      const cleanBase64 = params.imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      parts.push({
        inline_data: {
          mime_type: params.imageMime || 'image/jpeg',
          data: cleanBase64
        }
      });
    }

    const textContent = m.role === 'user' ? (m.content || '') : (m.korean || m.content || '');
    parts.push({ text: textContent || '안녕!' });
    contents.push({ role, parts });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-goog-api-key': cleanKey
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      contents,
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.85
      }
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  try {
    const parsed = JSON.parse(rawText);
    return {
      korean_text: parsed.korean_text || parsed.korean || '',
      korean: parsed.korean_text || parsed.korean || '',
      translation_text: parsed.translation_text || parsed.translation_zh || '',
      translation_zh: parsed.translation_text || parsed.translation_zh || '',
      translation_en: parsed.translation_en || '',
      tts_audio_text: parsed.tts_audio_text || parsed.korean_text || '',
      vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [],
      grammar_points: Array.isArray(parsed.grammar_points) ? parsed.grammar_points : [],
      learning_tip: parsed.learning_tip || ''
    };
  } catch {
    return {
      korean_text: rawText,
      korean: rawText,
      translation_text: '',
      translation_zh: '',
      tts_audio_text: rawText,
      vocabulary: [],
      grammar_points: [],
      learning_tip: ''
    };
  }
}
