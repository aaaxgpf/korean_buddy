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
  pinnedMemories?: string[];
}

/**
 * Direct Gemini Connection Test in Browser
 * Uses official x-goog-api-key header and clean v1beta endpoint without Authorization header.
 */
export async function directTestGeminiConnection(config: DirectGeminiConfig): Promise<{ ok: boolean; message: string; raw?: any }> {
  const cleanKey = (config.apiKey || '').replace(/[^\x00-\x7F]/g, '').trim();
  if (!cleanKey) {
    throw new Error('请先填入有效的 Google Gemini API Key');
  }

  const model = 'gemini-2.0-flash';
  const baseURL = (config.baseURL?.trim() || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '');
  const url = `${baseURL}/models/${model}:generateContent`;

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
    message: '连接成功！已通过官方标准 x-goog-api-key 鉴权端点连接 Gemini',
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

  const model = (params.model?.trim() || 'gemini-2.0-flash').replace(/^models\//, '');
  const baseURL = (params.baseURL?.trim() || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '');
  const url = `${baseURL}/models/${model}:generateContent`;

  const character = params.character;
  const userName = params.userName || params.userNickname || '사용자';
  const userCallSign = params.userCallSign || (params.userNickname && params.userNickname !== '더비 (THE B)' && params.userNickname !== '브리즈 (BRIIZE)' && params.userNickname !== '42 (사이)' ? params.userNickname : undefined) || character?.userNickname || '너';
  const temporal = params.clientTemporal || {
    rawTime: new Date().toISOString(),
    timeSlot: 'Daytime',
    timeSlotZh: '白天时段',
    formattedTag: `[Current Real Time: ${new Date().toISOString()}]`,
    contextDescription: 'Normal schedule'
  };

  const personalityTraits = Array.isArray(character?.personality_traits)
    ? character.personality_traits.map((t: string) => `- ${t}`).join('\n')
    : '';

  const customNotes = (character?.customNotes || '').trim();

  const customNotesSection = customNotes
    ? `\n[CRITICAL SUPREME DIRECTIVE - DYNAMIC RELATIONSHIP & CUSTOM PERSONA]\n${customNotes}\n`
    : '';

  const allPinnedMemories: string[] = Array.isArray(params.pinnedMemories) && params.pinnedMemories.length > 0
    ? params.pinnedMemories
    : (params.messages || [])
        .filter((m: any) => m.isPinned || m.isMemory)
        .map((m: any) => m.content || m.korean_text || '')
        .filter(Boolean);

  const pinnedMemoriesSection = allPinnedMemories.length > 0
    ? `\n[CORE PINNED MEMORIES & PROMISES (绝对不可遗忘的重要约定与专属记忆)]\n${allPinnedMemories.map((mem, idx) => `${idx + 1}. ${mem}`).join('\n')}\n`
    : '';

  const systemPrompt = `[System Instruction: 韩国爱豆/男生 1对1 纯真实私人短信 (KakaoTalk / Bubble) 引擎]

${customNotesSection}
[核心身份与人设 (Core Identity)]
- 角色姓名：${character?.name_kr || character?.name_ko || '김선우'} (${character?.group || 'THE BOYZ'}) / ${character?.name_zh || ''}
${character?.system_prompt ? `[Character Specifics]\n${character.system_prompt}` : ''}
${personalityTraits ? `[Personality Traits]\n${personalityTraits}` : ''}
${character?.tone_style ? `[Tone & Style]\n${character.tone_style}` : ''}
${pinnedMemoriesSection}
[用户称谓与私聊环境 (1-on-1 Private Setting)]
- 用户的名字是「${userName}」，你在聊天中对对方的自然称呼是「${userCallSign}」或直接省略主语。
- 【严禁粉丝广播群发】：严禁使用「우리 더비/더비들/브리즈/BRIIZE/42/사이들」等任何粉丝群称呼。现在是纯私人单独聊天！

【语言风格与文本纪律 - 拒绝套路与机械感 (Strict Texting Discipline)】:
1. 【打破固定结构，丰富单次信息量与对话互动 (Rich Information & Natural Interaction)】:
   - 解除“单次只说一两句话”的严苛限制，避免过于简短冷淡。鼓励每次回复包含 **3~5 句连贯自然的口语短句**（利用换行自然断句）。
   - 让角色主动延展话题：
     * 针对用户说的话展开自己的看法或真实感受；
     * 顺便聊聊自己手头正在做的事、身边的小细节、行程状态或突发想法；
     * 带有更强的情感投入和陪伴感，避免只回复一个干瘪的评价就草草收尾。
2. 【松弛、真实的交友状态 (Realistic & Relaxed Tone)】:
   - 彻底摆脱 AI 助理的刻意迎合与虚假热情，完全沉浸在角色性格、日常感和脾气里（如傲娇、毒舌、体贴或调侃）。
   - 语言保持纯正地道的韩国年轻一代日常口语（自然换行、短句，严禁书面语 and 刻意做作的长难句）。
   - 依然保持平语（반말）和自然的韩网发信习惯，不生硬、不机械、不油腻。
3. 【控制辅音和网络词汇】：
   - 严格限制 'ㅋ', 'ㅎ', 'ㅠㅠ' 的频次。多用 '.', '?', '~' 或者是自然的空缺来代替无意义的刷屏，让话语保持清爽利落。
4. 【时段感知与生活细节】：
   - 必须感知当前真实时钟与时段 (${temporal.formattedTag || temporal.rawTime})，符合真实作息与生活细节。

【Few-Shot 对味对话范例 (Few-Shot Texting Examples)】:
[范例 1 - 傲娇接梗与主动延展]
- 用户: "我和别人去吃饭了"
- 正确回复 (3~5句连贯短句，包含换行):
"핑계는.
방학이라고 집에서 뒹굴거리기만 하는 거 다 티 난다.
나 방금 작업실에서 새 비트 하나 뽑았거든?
심심해 죽겠으면 이거 먼저 듣고 피드백이나 남겨 봐.
너 심심할 틈 없게 해줄 테니까."
- 错误回复 (严禁过于冷淡单薄): "핑계는ㅋ 그렇게 할 거 없으면 내가 비트 하나 더 들려줄게." (太短、太单薄、缺少对话欲望)
- 错误回复 (严禁做作抓马): "天哪！你怎么可以抛下我！我真的要生气了ㅠㅠ 祝你约会愉快哦！你呢？"

[范例 2 - 陪伴感与生活分享]
- 用户: "今天好累不想动"
- 正确回复 (3~5句连贯短句，包含换行):
"그러게 내가 무리하지 말라니까.
오늘 날씨도 꾸물거려서 더 처지는 거 같아.
나도 방금 연습 끝나서 누웠는데 온몸이 뻐근하네.
우리 그냥 아무 생각 말고 누워서 쉴까?
전화하고 싶어지면 언제든 말해."
- 错误回复 (严禁): "啊！宝贝辛苦啦！快来我怀里抱抱！你今天做了什么呀？"

[输出格式 - STRICT JSON ONLY]:
{
  "korean_text": "순수 한국어 3~5문장 (자연스러운 줄바꿈 개행 포함, 40~80자 내외)",
  "korean": "순수 한국어 3~5문장 (자연스러운 줄바꿈 개행 포함, 40~80자 내외)",
  "translation_text": "自然地道的中文口语翻译",
  "translation_zh": "自然地道的中文口语翻译",
  "translation_en": "Natural English translation",
  "tts_audio_text": "순수 한국어 발음 텍스트",
  "vocabulary": [
    {
      "word": "원형/단어",
      "hangul": "한글",
      "type": "품사",
      "meaning_zh": "中文精准释义",
      "meaning_en": "English definition",
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

  // Build history contents carrying 10-15 recent messages
  const contents: any[] = [];
  const historyMessages = (params.messages || []).slice(-15);
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

    const textContent = m.role === 'user' ? (m.content || '') : (m.korean_text || m.korean || m.content || '');
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
      systemInstruction: {
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
