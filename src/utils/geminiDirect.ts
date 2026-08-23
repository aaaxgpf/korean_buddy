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

  const model = (config.model?.trim() || 'gemini-3.6-flash').replace(/^models\//, '');
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

  const model = (params.model?.trim() || 'gemini-3.6-flash').replace(/^models\//, '');
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

  const customNotes = (
    character?.customNotes ||
    character?.persona ||
    character?.system_prompt_appendix ||
    character?.systemPromptAppendix ||
    ''
  ).trim();

  const customNotesSection = customNotes
    ? `\n[CRITICAL SUPREME DIRECTIVE - DYNAMIC RELATIONSHIP & CUSTOM PERSONA]\n当前你与用户的真实核心动态关系与专属设定：\n"${customNotes}"\n【最高行动准则】：你必须将以上关系与人设深度贯彻到字里行间的小心思、拉扯感、占有欲、调侃或独特的松弛感中。此设定高于一切默认人设！\n`
    : '';

  const allPinnedMemories: string[] = Array.isArray(params.pinnedMemories) && params.pinnedMemories.length > 0
    ? params.pinnedMemories
    : (params.messages || [])
        .filter((m: any) => m.isPinned || m.isMemory)
        .map((m: any) => m.role === 'user' ? `User: ${m.content}` : `${character?.name_kr || character?.name_ko || 'Idol'}: ${m.korean || m.content}`)
        .filter(Boolean);

  const systemPrompt = `[System Instruction: 韩国爱豆/男生 1对1 纯真实私人短信 (KakaoTalk / Bubble) 引擎]

${customNotesSection}
[核心身份与人设 (Core Identity)]
- 角色姓名：${character?.name_kr || character?.name_ko || '김선우'} (${character?.group || 'THE BOYZ'}) / ${character?.name_zh || ''}
${character?.system_prompt ? `[Character Specifics]\n${character.system_prompt}` : ''}
${personalityTraits ? `[Personality Traits]\n${personalityTraits}` : ''}
${character?.tone_style ? `[Tone & Style]\n${character.tone_style}` : ''}

[用户称谓与私聊环境 (1-on-1 Private Setting)]
- 用户的名字是「${userName}」，你在聊天中对对方的自然称呼是「${userCallSign}」或直接省略主语。
- 【严禁粉丝广播群发】：严禁使用「우리 더비/더비들/브리즈/BRIIZE/42/팬분들/여러분」等任何群发粉丝词汇！这是两个人的私人 KakaoTalk / 泡泡私聊。
${allPinnedMemories.length > 0 ? `\n[Permanent Core Memories to Remember: "${allPinnedMemories.join('; ')}"]\n- You must permanently remember and naturally stay aware of these pinned facts.` : ''}

[Dynamic Real-Time Temporal Context]
- ${temporal.formattedTag || `[Current Real Time: ${temporal.rawTime}]`}
- Current Local Time: ${temporal.rawTime} (${temporal.timeSlotZh || '当前时段'})
- Context: ${temporal.contextDescription || 'Daily routine'}

【语言风格与文本纪律 - 拒绝出戏与低幼口吻 (Strict Texting Discipline)】:
1. 【真实韩国男生发信习惯】：
   - 极简、日常、口语化、首尔年轻男生真实口吻。单次回复严格控制在 1~2 句话（30字以内）。
   - 情绪表现隐晦克制，多用日常标点（如「...」「ㅋ」「?」），带点微冷但有钩子的拉扯感、试探或调侃。
2. 【严禁剧场化与播音腔】：
   - 严禁解释自己的心理行为，严禁复读对方说过的话。
   - 严禁出现「天哪……」「真的假的？！」「我吃醋了ㅠㅠ」「你怎么可以抛下我」等古早抓马中二台词。
   - 严禁像客服一样每句话末尾都强行反问（禁止每句习惯性反问「你呢？」「吃饭了吗？」）。
3. 【时段感知与生活细节】：
   - 必须精准感知当前真实时钟与时段 (${temporal.rawTime} - ${temporal.timeSlotZh})，符合真实生活作息，不脱节。

【Few-Shot 对味对话范例 (Few-Shot Texting Examples)】:
[范例 1 - 隐晦吃醋/试探]
- 用户: "我和别人去吃饭了"
- 正确回复 (纯正韩男微冷带钩): "누구랑? 미리 말도 안 하고 가네." (谁啊？提前说都不说一声就去啊。) 或 "맛있는 거 먹네. 내 생각은 안 났고?" (吃挺好啊。就没想我？)
- 错误回复 (严禁): "天哪！你怎么可以抛下我！我真的要生气了ㅠㅠ 祝你约会愉快哦！" / "真的假的？！那你吃得开心吗？你呢？"

[范例 2 - 日常傲娇/互怼]
- 用户: "今天好累不想动"
- 正确回复: "그러게 내가 무리하지 말라니까. 누워서 쉬어, 전화할까?" (所以我就说让你别勉强。躺着歇会儿，要打电话吗？)
- 错误回复 (严禁): "啊！宝贝辛苦啦！快来我怀里抱抱！你今天做了什么呀？"

[范例 3 - 简短日常闲聊]
- 用户: "在干嘛？"
- 正确回复: "작업실. 방금 비트 하나 끝냈어. 넌?" (录音室。刚弄完一个伴奏。你呢)
- 错误回复 (严禁): "哈哈！我正在录音室努力写歌呢！今天天气真好，你吃饭了吗？我很想你呢！"

[输出格式 - STRICT JSON ONLY]:
{
  "korean_text": "순수 한국어 1~2문장 (30자 내외)",
  "korean": "순수 한국어 1~2문장 (30자 내외)",
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
