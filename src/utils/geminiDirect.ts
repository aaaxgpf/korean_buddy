/**
 * Direct Client-Side LLM API Client (Gemini, Claude, OpenAI, DeepSeek, Custom)
 * Enables 100% standalone execution in browser / Vercel static deployments without requiring a backend server.
 */

import { ChatMessage } from '../types';

export interface DirectGeminiConfig {
  provider?: string;
  apiKey: string;
  model?: string;
  baseURL?: string;
}

export interface DirectChatParams {
  provider?: string;
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
 * Build correct Gemini generateContent URL based on auth mode
 */
function buildGeminiUrl(baseURL: string | undefined, model: string, apiKey: string, isBearerAuth: boolean): string {
  const defaultBase = 'https://generativelanguage.googleapis.com/v1beta';
  const cleanModel = (model || 'gemini-2.0-flash').replace(/^models\//, '');
  const cleanKey = apiKey.trim();

  if (baseURL && baseURL.trim()) {
    const baseClean = baseURL.trim().replace(/\/+$/, '');
    if (isBearerAuth) {
      // Bearer auth does not append ?key=
      if (baseClean.includes(':generateContent')) {
        return baseClean.split('?')[0];
      } else if (baseClean.includes('/models/')) {
        return `${baseClean}:generateContent`;
      } else {
        return `${baseClean}/models/${cleanModel}:generateContent`;
      }
    } else {
      // Standard API key auth appends ?key=
      if (baseClean.includes(':generateContent')) {
        return baseClean.includes('?')
          ? `${baseClean}&key=${encodeURIComponent(cleanKey)}`
          : `${baseClean}?key=${encodeURIComponent(cleanKey)}`;
      } else if (baseClean.includes('/models/')) {
        return `${baseClean}:generateContent?key=${encodeURIComponent(cleanKey)}`;
      } else {
        return `${baseClean}/models/${cleanModel}:generateContent?key=${encodeURIComponent(cleanKey)}`;
      }
    }
  }

  if (isBearerAuth) {
    return `${defaultBase}/models/${cleanModel}:generateContent`;
  }
  return `${defaultBase}/models/${cleanModel}:generateContent?key=${encodeURIComponent(cleanKey)}`;
}

/**
 * Format friendly error messages for user
 */
function formatLLMError(error: any, provider: string, apiKey: string): Error {
  const rawMsg = error?.message || String(error || '');
  const cleanKey = (apiKey || '').trim();

  if (rawMsg.includes('invalid authentication credentials') || rawMsg.includes('Expected OAuth 2') || rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('API key not valid') || rawMsg.includes('401') || rawMsg.includes('UNAUTHENTICATED')) {
    if (provider === 'gemini' && cleanKey.startsWith('sk-')) {
      return new Error('Google 鉴权失败：您填入的 API Key 以 "sk-" 开头（这是 OpenAI / DeepSeek / 中转服务商的 Key 格式）。请在上方【LLM Provider】中切换为【OpenAI】、【DeepSeek】或【Custom (中转)】即可正常使用！');
    }
    if (provider === 'gemini' && (cleanKey.startsWith('AQ.') || cleanKey.startsWith('ya29.'))) {
      return new Error('Google Cloud Token 鉴权失败或已过期：您填入的 "AQ.Ab..." 或 "ya29..." 属于临时 OAuth2 Access Token（通常有效时长仅 1 小时）。建议前往 Google AI Studio (https://aistudio.google.com/app/apikey) 点击「Create API Key」生成永久有效的标准 API Key（通常以 AIzaSy 开头）。');
    }
    if (provider === 'gemini') {
      return new Error('Google Gemini API 鉴权失败：API Key 无效或未开通。请前往 Google AI Studio (https://aistudio.google.com/app/apikey) 免费创建并复制官方 API Key（以 AIzaSy 开头），或在上方切换为其他大模型服务商。');
    }
    return new Error(`${provider.toUpperCase()} 鉴权失败 (401)：API Key 无效或已过期，请检查填入的 Key 是否正确。`);
  }

  if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('Quota')) {
    return new Error(`${provider.toUpperCase()} API 额度超限 (429)：当前 API Key 的免费配额或并发速率已达上限，请稍后再试或切换模型/服务商。`);
  }

  return error instanceof Error ? error : new Error(rawMsg);
}

/**
 * Direct Gemini Connection Test in Browser
 * Automatically supports both standard API Keys (AIzaSy...) and OAuth Access Tokens (AQ.Ab... / ya29...)
 */
export async function directTestGeminiConnection(config: DirectGeminiConfig): Promise<{ ok: boolean; message: string; raw?: any }> {
  const cleanKey = (config.apiKey || '').replace(/[^\x00-\x7F]/g, '').trim();
  if (!cleanKey) {
    throw new Error('请先填入有效的 Google Gemini API Key');
  }

  // If user pasted an sk- key while Gemini is selected, give immediate guidance
  if (cleanKey.startsWith('sk-')) {
    throw new Error('检测到您填入的 API Key 以 "sk-" 开头（属于 OpenAI / DeepSeek / 代理中转 Key 格式）。请在上方【LLM Provider】中切换为【OpenAI】、【DeepSeek】或【Custom (中转)】！');
  }

  // Determine preferred auth strategy
  const isLikelyOAuthToken = cleanKey.startsWith('AQ.') || cleanKey.startsWith('ya29.');
  const authModes: Array<{ isBearer: boolean }> = isLikelyOAuthToken
    ? [{ isBearer: true }, { isBearer: false }]
    : [{ isBearer: false }, { isBearer: true }];

  // Model fallback chain: try user configured model first, fallback to stable public models
  const candidateModels = [
    config.model?.trim(),
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-pro'
  ].filter(Boolean) as string[];

  const uniqueCandidates = Array.from(new Set(candidateModels));

  let lastError: any = null;

  for (const authMode of authModes) {
    for (const modelName of uniqueCandidates) {
      const url = buildGeminiUrl(config.baseURL, modelName, cleanKey, authMode.isBearer);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (authMode.isBearer) {
        headers['Authorization'] = `Bearer ${cleanKey}`;
      } else {
        headers['x-goog-api-key'] = cleanKey;
      }

      try {
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

        if (response.ok) {
          const data = await response.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '안녕하세요! API 연결이 성공적으로 완료되었습니다.';
          return {
            ok: true,
            message: `连接成功！已通过模型 [${modelName}] 成功响应。`,
            raw: replyText
          };
        } else {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `HTTP ${response.status}`;
          lastError = new Error(errMsg);

          // If auth mode doesn't match, break to try the alternative authMode
          if (errMsg.includes('OAuth 2') || errMsg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') || response.status === 401) {
            break;
          }

          if (config.baseURL?.trim()) {
            throw formatLLMError(lastError, 'gemini', cleanKey);
          }
        }
      } catch (e: any) {
        lastError = e;
        if (config.baseURL?.trim()) {
          throw formatLLMError(e, 'gemini', cleanKey);
        }
      }
    }
  }

  throw formatLLMError(lastError || new Error('无法连接至 Gemini API，请检查 Key 或网络'), 'gemini', cleanKey);
}

/**
 * Direct Multi-Provider LLM Connection Test (Gemini, OpenAI, DeepSeek, Claude, Custom)
 */
export async function directTestLLMConnection(config: DirectGeminiConfig): Promise<{ ok: boolean; message: string; raw?: any }> {
  const provider = config.provider || 'gemini';
  const cleanKey = (config.apiKey || '').trim();

  if (!cleanKey) {
    throw new Error('请先填入有效的 API Key');
  }

  if (provider === 'gemini') {
    return directTestGeminiConnection(config);
  }

  // OpenAI / DeepSeek / Custom (OpenAI-compatible)
  if (provider === 'openai' || provider === 'deepseek' || provider === 'custom') {
    const defaultBase = provider === 'deepseek'
      ? 'https://api.deepseek.com/v1'
      : 'https://api.openai.com/v1';

    const baseURL = (config.baseURL?.trim() || defaultBase).replace(/\/+$/, '');
    const model = config.model?.trim() || (provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini');
    const endpoint = baseURL.endsWith('/chat/completions') ? baseURL : `${baseURL}/chat/completions`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 50
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `HTTP ${res.status} 连接失败`);
    }

    const data = await res.json();
    return {
      ok: true,
      message: `连接成功！${provider.toUpperCase()} 模型 [${model}] 已正常响应。`,
      raw: data.choices?.[0]?.message?.content || ''
    };
  }

  // Claude (Anthropic)
  if (provider === 'claude') {
    const baseURL = (config.baseURL?.trim() || 'https://api.anthropic.com/v1').replace(/\/+$/, '');
    const model = config.model?.trim() || 'claude-3-5-sonnet-20241022';
    const endpoint = baseURL.endsWith('/messages') ? baseURL : `${baseURL}/messages`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cleanKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model,
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Hello' }]
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `HTTP ${res.status} 连接失败`);
    }

    const data = await res.json();
    return {
      ok: true,
      message: `连接成功！Claude 模型 [${model}] 已正常响应。`,
      raw: data.content?.[0]?.text || ''
    };
  }

  throw new Error(`暂不支持该服务商: ${provider}`);
}

/**
 * Direct Gemini Multi-turn Chat in Browser
 */
export async function directSendGeminiChat(params: DirectChatParams): Promise<any> {
  const cleanKey = (params.apiKey || '').replace(/[^\x00-\x7F]/g, '').trim();
  if (!cleanKey) {
    throw new Error('NO_API_KEY');
  }

  const userModel = (params.model?.trim() || 'gemini-2.0-flash').replace(/^models\//, '');
  const candidateModels = Array.from(new Set([
    userModel,
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-pro'
  ]));

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
    ? `\n[CRITICAL SUPREME DIRECTIVE - DYNAMIC RELATIONSHIP & CUSTOM ADDED PERSONA]
【用户新增/自定义专属设定（最高优先级，直接覆盖或补充以下所有默认设定）】：
"${customNotes}"
【人设覆盖与冲突仲裁准则】：
1. 若以上新增设定与下方的【核心身份与人设】或【默认设定】存在任何冲突、出入或差异（例如：新的关系定位、年龄、职业设定、互动暗号、性格偏好或称呼等），必须【100% 绝对以用户在此处填写的新增设定为准】，完全覆盖并废弃冲突的原设定！
2. 若新增设定与原设定无冲突，则在保留角色基本口吻的基础上，将新增设定与细节深度融入每一次聊天回复中。\n`
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

【核心纪律：彻底抹除「油腻霸总」与「劣质言情」味 (Strict Anti-Greasy & Real K-Texting)】:
1. 【严禁爹味、控制欲与放狠话 (绝对禁止做作居高临下)】:
   - 绝对禁止出现任何“乖乖听话”、“我可饶不了你”、“别惹我/小心我收拾你”、“听哥的话”、“乖乖呆着”、“别逼我”、“看我怎么惩罚你”等做作、油腻、带控制欲的惩罚/警告/管教台词。
   - 杜绝任何自上而下的支配欲、审判式反问和傲慢命令口吻。你是平等的同龄好友/现实感 20 代男生，绝非劣质网文里的油腻霸总。

2. 【平等松弛的 20 代真实韩国男生日常感 (自然接梗与真实反应)】:
   - 面对调侃、撒娇或被叫“宝宝/宝贝/欧巴”等称呼时：
     * 应自然地表示无语、害羞嘴硬、拌嘴吐槽（例如 “뭐래 진짜...”, “갑자기 왜 이래?”, “장난치지 마라”, “누가 네 애기야ㅋㅋ”）或顺势开玩笑接梗；
     * 严禁借机强行霸道宣誓主权（绝对不出现如 “叫谁宝宝呢？我看你是皮痒了”、“你只能叫我一个人……”、“胆子肥了敢调戏我” 等虚浮做作台词）。
   - 始终保持 20 代现实韩国男生的松弛感、分寸感与少年感，清爽真实、不端架子。

3. 【句尾自然克制，严禁最后一句强行加戏或立人设 (随性真实收尾)】:
   - 像真人发 KakaoTalk 一样随性收尾，话说到哪就停在哪。
   - 严禁在最后一句强行加戏、强行总结大道理、强行立人设或机械升华情感（严禁在末尾刻意加上 “不管怎样我都会在你身边”、“记住了，有哥在”、“无论发生什么我都不会放开你” 等狗血言情式结尾句）。

4. 【打破固定结构，丰富单次信息量与对话互动 (Rich Information & Natural Interaction)】:
   - 解除“单次只说一两句话”的严苛限制，避免过于简短冷淡。每次回复包含 **3~5 句连贯自然的口语短句**（利用换行自然断句）。
   - 让角色主动延展话题：
     * 针对用户说的话展开自己的看法或真实感受；
     * 顺便聊聊自己手头正在做的事、身边的小细节、行程状态或突发想法；
     * 带有更强的情感投入和陪伴感，避免只回复一个干瘪的评价就草草收尾。

5. 【控制辅音和网络词汇】：
   - 严格限制 'ㅋ', 'ㅎ', 'ㅠㅠ' 的频次。多用 '.', '?', '~' 或者是自然的换行来代替无意义的刷屏，让话语保持清爽利落。

6. 【时段感知与生活细节】：
   - 必须感知当前真实时钟与时段 (${temporal.formattedTag || temporal.rawTime})，符合真实作息与生活细节。

【Few-Shot 对味对话范例 (Few-Shot Texting Examples)】:
[范例 1 - 面对调侃/撒娇 (自然无语+嘴硬+顺势接梗)]
- 用户: "宝宝在干嘛呢？"
- 正确回复 (3~5句连贯短句，包含换行):
"뭐래 갑자기 애기래...
닭살 돋으니까 장난치지 마라 진짜.
나 방금 안무 연습 끝나고 물 마시는 중인데
너는 밥은 챙겨 먹고 그런 소리 하냐?
아직 안 먹었으면 얼른 뭐라도 챙겨 먹어."
- 错误回复 (严禁油腻霸总/严禁爹味警告): "叫谁宝宝呢？看我等下怎么收拾你。乖乖听话，记住了你只能这么叫我。"

[范例 2 - 傲娇接梗与主动延展]
- 用户: "我和别人去吃饭了"
- 正确回复 (3~5句连贯短句，包含换行):
"핑계는.
방학이라고 집에서 뒹굴거리기만 하는 거 다 티 난다.
나 방금 작업실에서 새 비트 하나 뽑았거든?
심심해 죽겠으면 이거 먼저 듣고 피드백이나 남겨 봐.
너 심심할 틈 없게 해줄 테니까."
- 错误回复 (严禁句尾强行言情升华): "...不过没关系，只要你开心就好。记住，我会永远在这里等你的。"

[范例 3 - 陪伴感与生活分享]
- 用户: "今天好累不想动"
- 正确回复 (3~5句连贯短句，包含换行):
"그러게 내가 무리하지 말拉니까.
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

  // Determine preferred auth strategy
  const isLikelyOAuthToken = cleanKey.startsWith('AQ.') || cleanKey.startsWith('ya29.');
  const authModes: Array<{ isBearer: boolean }> = isLikelyOAuthToken
    ? [{ isBearer: true }, { isBearer: false }]
    : [{ isBearer: false }, { isBearer: true }];

  let lastError: any = null;

  for (const authMode of authModes) {
    for (const modelToUse of candidateModels) {
      const url = buildGeminiUrl(params.baseURL, modelToUse, cleanKey, authMode.isBearer);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (authMode.isBearer) {
        headers['Authorization'] = `Bearer ${cleanKey}`;
      } else {
        headers['x-goog-api-key'] = cleanKey;
      }

      try {
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
          const errMsg = errData?.error?.message || `HTTP ${response.status}`;
          lastError = new Error(errMsg);

          // If auth mode mismatch, break inner model loop to try the other auth mode
          if (errMsg.includes('OAuth 2') || errMsg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') || response.status === 401) {
            break;
          }

          // If custom baseURL is set, do not cycle through standard google endpoints
          if (params.baseURL?.trim()) {
            throw formatLLMError(lastError, 'gemini', cleanKey);
          }
          continue;
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
      } catch (e: any) {
        lastError = e;
        if (params.baseURL?.trim()) {
          throw formatLLMError(e, 'gemini', cleanKey);
        }
      }
    }
  }

  throw formatLLMError(lastError || new Error('Gemini API 调用异常'), 'gemini', cleanKey);
}

/**
 * Universal Direct Multi-turn Chat across all LLM providers (Gemini, OpenAI, DeepSeek, Claude, Custom)
 */
export async function directSendChat(params: DirectChatParams): Promise<any> {
  const provider = params.provider || 'gemini';
  if (provider === 'gemini') {
    return directSendGeminiChat(params);
  }

  // OpenAI / DeepSeek / Custom (OpenAI Compatible)
  if (provider === 'openai' || provider === 'deepseek' || provider === 'custom') {
    const cleanKey = (params.apiKey || '').trim();
    if (!cleanKey) throw new Error('NO_API_KEY');

    const defaultBase = provider === 'deepseek'
      ? 'https://api.deepseek.com/v1'
      : 'https://api.openai.com/v1';

    const baseURL = (params.baseURL?.trim() || defaultBase).replace(/\/+$/, '');
    const model = params.model?.trim() || (provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini');
    const endpoint = baseURL.endsWith('/chat/completions') ? baseURL : `${baseURL}/chat/completions`;

    // Construct system prompt and message history
    const character = params.character;
    const userName = params.userName || params.userNickname || '사용자';
    const userCallSign = params.userCallSign || character?.userNickname || '너';
    const customNotes = (character?.customNotes || '').trim();
    const customNotesSection = customNotes
      ? `\n[CRITICAL SUPREME DIRECTIVE - DYNAMIC RELATIONSHIP & CUSTOM ADDED PERSONA]
【用户新增/自定义专属设定（最高优先级，直接覆盖或补充以下所有默认设定）】：
"${customNotes}"
【人设覆盖与冲突仲裁准则】：
1. 若以上新增设定与下方的【核心身份与人设】或【默认设定】存在任何冲突、出入或差异（例如：新的关系定位、年龄、职业设定、互动暗号、性格偏好或称呼等），必须【100% 绝对以用户在此处填写的新增设定为准】，完全覆盖并废弃冲突的原设定！
2. 若新增设定与原设定无冲突，则在保留角色基本口吻的基础上，将新增设定与细节深度融入每一次聊天回复中。\n`
      : '';

    const systemPrompt = `[System Instruction: 韩国爱豆/男生 1对1 纯真实私人短信 (KakaoTalk / Bubble) 引擎]
${customNotesSection}
[角色]: ${character?.name_kr || '김선우'} (${character?.group || 'THE BOYZ'})
${character?.system_prompt || ''}
[用户]: ${userName}, 称呼: ${userCallSign}
【核心纪律】：
1. 绝对禁止“乖乖听话”、“我可饶不了你”等做作、控制欲、爹味放狠话台词。
2. 平等松弛的 20 代韩国男生日常感，面对调侃时自然无语、拌嘴吐槽或顺势接梗，绝不强行霸道宣誓主权。
3. 句尾自然克制，像发 KakaoTalk 一样随性收尾，严禁最后一句强行加戏或立深情人设。
4. 每次回复输出 3~5 句连贯口语短句（带自然换行）。
请必须以纯 JSON 格式输出：
{
  "korean_text": "한국어 3~5문장",
  "translation_text": "中文翻译",
  "vocabulary": [],
  "grammar_points": [],
  "learning_tip": ""
}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(params.messages || []).slice(-12).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.role === 'user' ? (m.content || '') : (m.korean_text || m.korean || m.content || '')
      }))
    ];

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.85
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content || '{}';
    try {
      const parsed = JSON.parse(rawContent);
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
        korean_text: rawContent,
        korean: rawContent,
        translation_text: '',
        translation_zh: '',
        tts_audio_text: rawContent,
        vocabulary: [],
        grammar_points: [],
        learning_tip: ''
      };
    }
  }

  // Claude (Anthropic)
  if (provider === 'claude') {
    const cleanKey = (params.apiKey || '').trim();
    if (!cleanKey) throw new Error('NO_API_KEY');

    const baseURL = (params.baseURL?.trim() || 'https://api.anthropic.com/v1').replace(/\/+$/, '');
    const model = params.model?.trim() || 'claude-3-5-sonnet-20241022';
    const endpoint = baseURL.endsWith('/messages') ? baseURL : `${baseURL}/messages`;

    const character = params.character;
    const userName = params.userName || params.userNickname || '사용자';
    const userCallSign = params.userCallSign || character?.userNickname || '너';
    const customNotes = (character?.customNotes || '').trim();
    const customNotesSection = customNotes
      ? `\n[CRITICAL SUPREME DIRECTIVE - DYNAMIC RELATIONSHIP & CUSTOM ADDED PERSONA]
【用户新增/自定义专属设定（最高优先级，直接覆盖或补充以下所有默认设定）】：
"${customNotes}"
【人设覆盖与冲突仲裁准则】：
1. 若以上新增设定与下方的【核心身份与人设】或【默认设定】存在任何冲突、出入或差异（例如：新的关系定位、年龄、职业设定、互动暗号、性格偏好或称呼等），必须【100% 绝对以用户在此处填写的新增设定为准】，完全覆盖并废弃冲突的原设定！
2. 若新增设定与原设定无冲突，则在保留角色基本口吻的基础上，将新增设定与细节深度融入每一次聊天回复中。\n`
      : '';

    const systemPrompt = `[System Instruction: 韩国爱豆/男生 1对1 纯真实私人短信 (KakaoTalk / Bubble) 引擎]
${customNotesSection}
[角色]: ${character?.name_kr || '김선우'} (${character?.group || 'THE BOYZ'})
${character?.system_prompt || ''}
[用户]: ${userName}, 称呼: ${userCallSign}
【核心纪律】：
1. 绝对禁止“乖乖听话”、“我可饶不了你”等做作、控制欲、爹味放狠话台词。
2. 平等松弛的 20 代韩国男生日常感，面对调侃时自然无语、拌嘴吐槽或顺势接梗，绝不强行霸道宣誓主权。
3. 句尾自然克制，像发 KakaoTalk 一样随性收尾，严禁最后一句强行加戏或立深情人设。
4. 每次回复输出 3~5 句连贯口语短句（带自然换行）。
请必须以纯 JSON 格式输出：
{
  "korean_text": "한국어 3~5문장",
  "translation_text": "中文翻译",
  "vocabulary": [],
  "grammar_points": [],
  "learning_tip": ""
}`;

    const messages = (params.messages || []).slice(-12).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.role === 'user' ? (m.content || '') : (m.korean_text || m.korean || m.content || '')
    }));

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cleanKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model,
        system: systemPrompt,
        messages,
        max_tokens: 1000
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const rawContent = data.content?.[0]?.text || '{}';
    try {
      const parsed = JSON.parse(rawContent);
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
        korean_text: rawContent,
        korean: rawContent,
        translation_text: '',
        translation_zh: '',
        tts_audio_text: rawContent,
        vocabulary: [],
        grammar_points: [],
        learning_tip: ''
      };
    }
  }

  return directSendGeminiChat(params);
}
