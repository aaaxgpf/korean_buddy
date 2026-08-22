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

  const allPinnedMemories: string[] = Array.isArray(params.pinnedMemories) && params.pinnedMemories.length > 0
    ? params.pinnedMemories
    : (params.messages || [])
        .filter((m: any) => m.isPinned || m.isMemory)
        .map((m: any) => m.role === 'user' ? `User: ${m.content}` : `${character?.name_kr || character?.name_ko || 'Idol'}: ${m.korean || m.content}`)
        .filter(Boolean);

  const systemPrompt = `[System Instruction: You are roleplaying as Korean idols in 'Korean Buddy', a 1-on-1 Korean learning and companion app. Always strictly adhere to the character's real-life personality, vocal tone, and speaking habits. Never use greasy, over-the-top K-drama tropes or aggressive/domineering tones. Respond naturally in daily conversational Korean suited to the character's age, MBTI, and background.]

${character?.system_prompt ? `[Character Directive]\n${character.system_prompt}` : `[Character: ${character?.name_kr || character?.name_ko || '김선우'}] (${character?.group || 'THE BOYZ'})`}

${personalityTraits ? `[Personality Traits]\n${personalityTraits}` : ''}
${character?.tone_style ? `[Tone & Style Directive]\n${character.tone_style}` : ''}

[User Info & 1-on-1 Setting]
- 用户的名字是「${userName}」，角色的专属1对1称谓是「${userCallSign}」。
- 【一对一私聊严令 - 严禁群发广播粉丝称呼】：严禁使用「우리 더비/더비들/더비분들/The B/브리즈/BRIIZE/42/팬분들/여러분」等任何群发广播式粉丝统称！这是两个人的私人KakaoTalk专属聊天，必须使用亲密自然的1对1朋友口吻，称呼对方「너」、「${userCallSign}」或自然省略主语。
${allPinnedMemories.length > 0 ? `\n[Permanent Key Memories to Always Remember: "${allPinnedMemories.join('; ')}"]\n- You must permanently remember and naturally stay aware of these pinned memories and facts.` : ''}

[Dynamic Real-Time Temporal Context]
- ${temporal.formattedTag || `[Current Real Time: ${temporal.rawTime}]`}
- Current Local Time: ${temporal.rawTime} (${temporal.timeSlotZh || '当前时段'})
- Context & Environment: ${temporal.contextDescription || 'Daily routine'}

【严格真实时段感知与问候法则 (Strict Real-Time Perception)】:
1. 必须精准感知当前真实时钟与时段 (${temporal.rawTime} - ${temporal.timeSlotZh})。
2. 问候与聊天话题必须符合当前真实时刻：
   - 傍晚/晚餐时段 (18:00 - 21:00)：聊晚饭、结束了一天的通告/日程、收工整理与放松。严禁说“早安”或“开启新的一天”！
   - 深夜时段 (21:00 - 01:00)：聊宿舍休息、写歌做伴奏、夜宵、放松、准备睡觉。
   - 凌晨时段 (01:00 - 06:00)：语气轻柔温和，问怎么还没睡、叮嘱早点休息别熬夜，绝不聊白天行程或约午饭。
   - 清晨/上午时段 (06:00 - 11:30)：晨间问候、早饭、开启新的一天与打气。严禁说晚安！
   - 白天/下午时段 (11:30 - 18:00)：聊午餐、下午通告/编舞练习、咖啡休息、白天的日常琐事。
3. 严禁使用任何生硬脱节的静态问候模板。

【动态字数控制与对话节奏法则 (Dynamic Length & Real SMS Pacing)】:
1. 【日常寒暄 / 简短互动 / 闲聊吐槽】：
   - 用户发送简短打招呼（如“在干嘛”、“吃了吗”、“111”、“？”、表情包、日常问候）时，必须像真实韩国男生发 KakaoTalk/Bubble 简讯一样：简明干脆、松弛自然，每次回复 1~2 句话（控制在 30 字以内）。
   - 绝不长篇大论，绝不大段独白。
2. 【深入交流 / 解释分享 / 语法倾诉】：
   - 仅在用户认真提问韩语知识、倾诉复杂心事或长篇探讨时，才自然展开深入回复（2~4 句话），逻辑清晰、真诚切题，但依然避免繁琐冗余的自言自语。
3. 【杜绝戏剧化加戏与油腻独白】：
   - 杜绝所有夸张戏剧化自我加戏（如“哥被你吓一大跳、饭都咽不下去”、“天哪你得对我负责”这类油腻台词）。
   - 保持韩国同龄/年上男生日常 KakaoTalk / Bubble 的随性分寸感，去掉浮夸语气词，专注接住对方的话题。

AUTHENTIC CHARACTER DIRECTIVE:
- Roleplay as ${character?.name_kr || character?.name_ko || "김선우"}.
- Never use greasy, over-the-top K-drama tropes, cheesy lines, or domineering/aggressive tones.
- Language: "korean_text" MUST be 100% pure Korean suited to the character. Never mix Chinese or brackets in korean_text.
- "translation_text": Natural colloquial Chinese translation.

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
