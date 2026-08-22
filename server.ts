import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialization of GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. High-fidelity persona fallbacks will be used.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "dummy-key-for-init",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Supported fallback model candidates in order of preference (prioritizing highly available active models)
const MODEL_CANDIDATES = [
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.6-flash",
  "gemini-3.1-pro-preview",
];

// Robust direct Gemini REST caller that strictly complies with Google API key auth
async function callGeminiREST(params: {
  apiKey: string;
  model?: string;
  baseURL?: string;
  systemPrompt?: string;
  messages: Array<{ role: string; content: string }>;
  jsonMode?: boolean;
  temperature?: number;
  imageBase64?: string;
  imageMime?: string;
}): Promise<string> {
  const apiKey = (params.apiKey || '').replace(/[^\x00-\x7F]/g, '').trim();
  if (!apiKey) {
    throw new Error("NO_API_KEY");
  }

  const requestedModel = (params.model?.trim() || "gemini-3.7-flash").replace(/^models\//, "");
  const customBase = params.baseURL?.trim();
  const defaultBase = "https://generativelanguage.googleapis.com/v1beta";

  // Build contents payload
  const contents = params.messages.map((m) => {
    const parts: any[] = [];
    if (m.role === "user" && params.imageBase64) {
      const cleanBase64 = params.imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
      parts.push({
        inline_data: {
          mime_type: params.imageMime || "image/jpeg",
          data: cleanBase64,
        },
      });
    }
    parts.push({ text: m.content || "" });
    return {
      role: m.role === "user" ? "user" : "model",
      parts,
    };
  });

  const requestBody: any = {
    contents,
    generationConfig: {
      temperature: params.temperature ?? 0.85,
    },
  };

  if (params.systemPrompt) {
    requestBody.system_instruction = {
      parts: [{ text: params.systemPrompt }],
    };
  }

  if (params.jsonMode) {
    requestBody.generationConfig.responseMimeType = "application/json";
  }

  // Models to attempt: requested model first, then candidates if on default endpoint
  const modelsToTry = customBase 
    ? [requestedModel]
    : [requestedModel, ...MODEL_CANDIDATES.filter((m) => m !== requestedModel)];

  let lastError: any = null;

  for (const model of modelsToTry) {
    let url: string;
    if (customBase) {
      const baseClean = customBase.replace(/\/+$/, "");
      if (baseClean.includes(":generateContent")) {
        url = baseClean.includes("?")
          ? `${baseClean}&key=${encodeURIComponent(apiKey)}`
          : `${baseClean}?key=${encodeURIComponent(apiKey)}`;
      } else if (baseClean.includes("/models/")) {
        url = `${baseClean}:generateContent?key=${encodeURIComponent(apiKey)}`;
      } else {
        url = `${baseClean}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      }
    } else {
      url = `${defaultBase}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    }

    try {
      // STRICT RULES FOR GEMINI AUTHENTICATION:
      // 1. NEVER set "Authorization: Bearer <API_KEY>" in headers (causes 401 ACCESS_TOKEN_TYPE_UNSUPPORTED)
      // 2. Pass apiKey via URL query parameter: ?key=${apiKey}
      // 3. Set "x-goog-api-key": apiKey in Request Headers
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errText = await res.text();
        let errorDetail = errText;
        try {
          const jsonErr = JSON.parse(errText);
          if (jsonErr.error?.message) {
            errorDetail = jsonErr.error.message;
          }
        } catch (_) {}

        // If 401 Unauthorized or 400 API_KEY_INVALID, give a crystal clear message and stop trying
        if (res.status === 401 || (res.status === 400 && (errorDetail.includes("API_KEY_INVALID") || errorDetail.includes("API key not valid")))) {
          throw new Error(`Google Gemini 鉴权失败 (${res.status}): API Key 无效或未开通权限。请在 Settings 设置中检查填入的 Google API Key 是否有效（兼容 AQ.Ab... 及 AIzaSy... 等格式）。`);
        }

        // If 404 (model not found), 503 (model overloaded), or 429 (quota / rate limit exceeded) and we have fallbacks, try next candidate
        if ((res.status === 404 || res.status === 503 || res.status === 429) && modelsToTry.length > 1) {
          lastError = new Error(`Gemini API (${res.status}) on ${model}: ${errorDetail}`);
          console.warn(`Gemini model ${model} returned status ${res.status}, failing over to next candidate...`);
          continue;
        }

        if (res.status === 429) {
          throw new Error(`Gemini API 额度超限 (429 RESOURCE_EXHAUSTED)：该 API Key 当前调用频次或免费额度已达上限，建议稍等片刻重试或在 Settings 设置中切换模型/服务商。`);
        }

        throw new Error(`Gemini API Error (${res.status}): ${errorDetail}`);
      }

      const data = await res.json();
      const candidate = data.candidates?.[0];
      if (!candidate?.content?.parts) {
        if (data.promptFeedback?.blockReason) {
          throw new Error(`Gemini blocked content: ${data.promptFeedback.blockReason}`);
        }
        throw new Error("Gemini API returned an empty response candidate");
      }

      const resultText = candidate.content.parts
        .map((p: any) => p.text || "")
        .join("");

      return resultText;
    } catch (err: any) {
      lastError = err;
      if (customBase || (err.message && (err.message.includes("401") || err.message.includes("鉴权失败") || err.message.includes("API_KEY_INVALID")))) {
        break; // don't try other models if credentials are fundamentally invalid
      }
    }
  }

  throw lastError || new Error("Gemini API request failed");
}

// Helper to generate content with automatic retries and model fallbacks
async function generateGeminiContentWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    systemInstruction?: string;
    responseMimeType?: string;
    temperature?: number;
  },
  maxRetriesPerModel = 1
): Promise<string> {
  let lastError: any = null;

  for (const model of MODEL_CANDIDATES) {
    for (let attempt = 0; attempt <= maxRetriesPerModel; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: {
            systemInstruction: params.systemInstruction,
            responseMimeType: params.responseMimeType || "application/json",
            temperature: params.temperature ?? 0.85,
          },
        });

        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        
        // Fast-fail if authentication or API key is invalid - no point retrying candidate models
        if (
          errMsg.includes("401") ||
          errMsg.includes("UNAUTHENTICATED") ||
          errMsg.includes("API_KEY_INVALID") ||
          errMsg.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED")
        ) {
          throw new Error("Google Gemini 鉴权失败：API Key 无效或未开通权限，请在 Settings 设置中检查填入的 Google API Key（兼容 AQ.Ab... 及 AIzaSy... 等格式）。");
        }

        console.warn(`Attempt ${attempt + 1} with model ${model} failed: ${errMsg}`);
        if (
          errMsg.includes("404") ||
          errMsg.includes("NOT_FOUND") ||
          errMsg.includes("no longer available") ||
          errMsg.includes("429") ||
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          errMsg.includes("quota")
        ) {
          break; // move directly to next candidate model
        }
      }
    }
  }

  throw lastError || new Error("All Gemini model candidates failed");
}

// Helper to strip any brackets or Chinese characters from pure Korean text
function cleanPureKorean(text: string): string {
  if (!text) return "";
  return text
    .replace(/\([^)]*[\u4e00-\u9fa5]+[^)]*\)/g, "") // remove (chinese)
    .replace(/\[[^\]]*[\u4e00-\u9fa5]+[^\]]*\]/g, "") // remove [chinese]
    .replace(/（[^）]*[\u4e00-\u9fa5]+[^）]*）/g, "") // remove fullwidth （chinese）
    .replace(/【[^】]*[\u4e00-\u9fa5]+[^】]*】/g, "") // remove 【chinese】
    .replace(/[\u4e00-\u9fa5]/g, "") // strip any stray Chinese characters from Korean bubble
    .trim();
}

// Robust JSON extraction from LLM response (handles code fences, trailing explanations, unescaped characters)
function safeExtractJSON<T = any>(rawText: string, fallback?: T): T {
  if (!rawText || typeof rawText !== 'string') {
    return (fallback ?? ({} as unknown as T));
  }

  const trimmed = rawText.trim();

  // 1. Direct try
  try {
    return JSON.parse(trimmed);
  } catch (_) {
    // Continue
  }

  // 2. Try markdown code block fences (```json ... ``` or ``` ... ```)
  try {
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      const blockContent = codeBlockMatch[1].trim();
      try {
        return JSON.parse(blockContent);
      } catch (_) {
        const firstB = blockContent.indexOf('{');
        const lastB = blockContent.lastIndexOf('}');
        if (firstB !== -1 && lastB !== -1 && lastB > firstB) {
          return JSON.parse(blockContent.substring(firstB, lastB + 1));
        }
      }
    }
  } catch (_) {
    // Continue
  }

  // 3. Extract substring between first '{' and last '}'
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (_) {
      try {
        // Strip trailing commas before closing braces/brackets
        const sanitized = candidate.replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(sanitized);
      } catch (_) {
        // Continue
      }
    }
  }

  // 4. Extract substring between first '[' and last ']'
  const firstBracket = trimmed.indexOf('[');
  const lastBracket = trimmed.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const candidate = trimmed.substring(firstBracket, lastBracket + 1);
    try {
      return JSON.parse(candidate);
    } catch (_) {
      try {
        const sanitized = candidate.replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(sanitized);
      } catch (_) {
        // Continue
      }
    }
  }

  // 5. Fallback object if provided
  if (fallback !== undefined) {
    return fallback;
  }

  // 6. Return graceful structured fallback
  return {
    korean_text: cleanPureKorean(trimmed),
    korean: cleanPureKorean(trimmed),
    translation_text: trimmed,
    translation_zh: trimmed,
    tts_audio_text: cleanPureKorean(trimmed),
    vocabulary: [],
    grammar_points: []
  } as unknown as T;
}

// Compute or format real-time temporal context
function computeTemporalContext(clientTemporal?: any) {
  if (clientTemporal?.formattedTag) {
    return {
      formattedTag: clientTemporal.formattedTag,
      timeSlot: clientTemporal.timeSlot || "Daytime",
      timeSlotKo: clientTemporal.timeSlotKo || "낮 / 안무 연습 및 스케줄",
      timeSlotZh: clientTemporal.timeSlotZh || "白天 / 编舞练习与通告日程",
      contextDescription: clientTemporal.contextDescription || "The idol is in the middle of dance/vocal rehearsal, schedule, studio work, or lunch.",
      rawTime: clientTemporal.rawTime || new Date().toISOString(),
    };
  }

  // Fallback server-side time calculation (KST / Local)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[now.getDay()];
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul';

  let timeSlot = 'Daytime & Practice';
  let timeSlotKo = '낮 / 안무 연습 및 스케줄';
  let timeSlotZh = '白天 / 编舞练习与通告日程';
  let contextDescription = 'The idol is in the middle of dance/vocal rehearsal, schedule, studio work, or lunch.';

  if (hours >= 6 && hours < 9) {
    timeSlot = 'Early Morning';
    timeSlotKo = '이른 아침 / 기상 및 하루 준비';
    timeSlotZh = '清晨 / 起床与晨间准备';
    contextDescription = 'The idol has just woken up or started their morning routine, breakfast, getting ready.';
  } else if (hours >= 9 && hours < 18) {
    timeSlot = 'Daytime & Practice';
    timeSlotKo = '낮 / 안무 연습 및 스케줄';
    timeSlotZh = '白天 / 编舞练习与通告日程';
    contextDescription = 'The idol is in the middle of dance/vocal rehearsal, schedule, studio work, or lunch.';
  } else if (hours >= 18 && hours < 21) {
    timeSlot = 'Evening & Dinner';
    timeSlotKo = '저녁 / 식사 및 연습 마무리';
    timeSlotZh = '傍晚 / 晚饭与收工整理';
    contextDescription = 'The idol is having dinner, finishing up schedule/rehearsals, heading back to dorm/studio.';
  } else if (hours >= 21 || hours < 1) {
    timeSlot = 'Late Night & Personal Time';
    timeSlotKo = '심야 / 개인 시간 및 야식·작업';
    timeSlotZh = '深夜 / 个人时间与宵夜·写歌';
    contextDescription = 'The idol is in their room, chilling, eating late-night snacks, working on lyrics/tracks in studio, or winding down.';
  } else {
    timeSlot = 'Midnight & Dawn (Rest/Late Studio)';
    timeSlotKo = '새벽 / 숙소 휴식 또는 심야 작업';
    timeSlotZh = '凌晨 / 宿舍休息或深夜录音棚';
    contextDescription = 'It is late at night / early dawn (1:00-6:00 AM). The idol is either finishing late-night studio work or in bed winding down. They should naturally acknowledge the late hour, speak softly/empathetically, and advise the user to rest well without making illogical comments about daytime activities.';
  }

  return {
    rawTime: `${year}-${month}-${date} ${String(hours).padStart(2, '0')}:${minutes}`,
    dayOfWeek: dayName,
    timeZone,
    timeSlot,
    timeSlotKo,
    timeSlotZh,
    contextDescription,
    formattedTag: `[Current Real Time: ${year}-${month}-${date} ${String(hours).padStart(2, '0')}:${minutes}, ${dayName}, ${timeZone}] - Slot: ${timeSlot} (${timeSlotZh})`
  };
}

// Universal Multi-Provider Real LLM Execution Engine
interface CustomLLMConfig {
  provider?: 'anthropic' | 'openai' | 'deepseek' | 'gemini' | 'custom';
  apiKey?: string;
  baseURL?: string;
  model?: string;
}

async function executeUniversalLLM(params: {
  systemPrompt: string;
  messages: Array<{ role: string; content: string }>;
  customConfig?: CustomLLMConfig;
  jsonMode?: boolean;
  imageBase64?: string;
  imageMime?: string;
}): Promise<string> {
  const { systemPrompt, messages, customConfig, jsonMode = true, imageBase64, imageMime } = params;
  const provider = customConfig?.provider || 'gemini';
  const apiKey = customConfig?.apiKey?.trim() || '';
  const baseURL = customConfig?.baseURL?.trim() || '';
  const model = customConfig?.model?.trim() || '';

  // 1. User provided Custom / Third-party LLM Key
  if (apiKey) {
    if (provider === 'anthropic') {
      const endpoint = baseURL || 'https://api.anthropic.com/v1/messages';
      const formattedMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        }));

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: model || 'claude-3-5-sonnet-20241022',
          max_tokens: 2048,
          system: systemPrompt,
          messages: formattedMessages
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Anthropic API Error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      return data.content?.[0]?.text || '';
    } else if (provider === 'openai' || provider === 'deepseek' || (provider === 'custom' && !baseURL?.includes('generativelanguage.googleapis.com/v1beta/models'))) {
      const defaultEndpoint = provider === 'deepseek'
        ? 'https://api.deepseek.com/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';
      const endpoint = baseURL ? (baseURL.endsWith('/chat/completions') ? baseURL : `${baseURL.replace(/\/+$/, '')}/chat/completions`) : defaultEndpoint;
      const defaultModel = provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o';

      const payloadMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        }))
      ];

      const body: any = {
        model: model || defaultModel,
        messages: payloadMessages,
        temperature: 0.85
      };

      if (jsonMode && (provider === 'openai' || provider === 'deepseek')) {
        body.response_format = { type: 'json_object' };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`${provider.toUpperCase()} API Error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    } else if (provider === 'gemini' || (provider === 'custom' && baseURL?.includes('generativelanguage.googleapis.com'))) {
      return await callGeminiREST({
        apiKey,
        model: model || 'gemini-3.6-flash',
        baseURL,
        systemPrompt,
        messages,
        jsonMode,
        imageBase64,
        imageMime,
        temperature: 0.88
      });
    }
  }

  // 2. Server default Gemini key (AI Studio built-in)
  if (process.env.GEMINI_API_KEY) {
    const ai = getAI();
    let contentsPayload: any;
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      const mimeType = imageMime || 'image/jpeg';
      contentsPayload = {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } },
          { text: messages.map(m => `${m.role}: ${m.content}`).join('\n\n') }
        ]
      };
    } else {
      contentsPayload = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    }

    return await generateGeminiContentWithFallback(ai, {
      contents: contentsPayload,
      systemInstruction: systemPrompt,
      responseMimeType: jsonMode ? 'application/json' : undefined,
      temperature: 0.85
    });
  }

  throw new Error("NO_API_KEY");
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Test LLM Connection endpoint
app.post("/api/test-llm", async (req, res) => {
  const { provider, apiKey, baseURL, model } = req.body;
  try {
    const testPrompt = "You are an AI assistant. Reply in JSON format with { \"status\": \"connected\", \"message\": \"안녕하세요! API 연결이 성공적으로 완료되었습니다.\" }";
    const rawResult = await executeUniversalLLM({
      systemPrompt: testPrompt,
      messages: [{ role: "user", content: "ping" }],
      customConfig: { provider, apiKey, baseURL, model },
      jsonMode: true
    });
    res.json({ ok: true, message: "连接成功！大模型已就绪", raw: rawResult });
  } catch (err: any) {
    console.error("Test LLM error:", err);
    const msg = err.message === "NO_API_KEY" ? "请先填入有效的 API Key" : (err.message || String(err));
    res.status(400).json({ ok: false, error: msg });
  }
});

// Companion Chat endpoint - Full multi-turn live LLM roleplay for all 7 idols
app.post("/api/chat", async (req, res) => {
  const { character, messages, userNickname, userName, userCallSign, languageMode = "bilingual", imageBase64, imageMime, videoLink, videoInfo, clientTemporal, apiConfig, pinnedMemories: customPinnedMemories } = req.body;
  const temporal = computeTemporalContext(clientTemporal);

  try {
    const charId = character?.id || "eric";
    const effectiveUserName = userName || userNickname || "사용자";
    const effectiveCallSign = userCallSign || (userNickname && userNickname !== '더比 (THE B)' && userNickname !== '브리즈 (BRIIZE)' && userNickname !== '42 (사이)' ? userNickname : undefined) || character?.userNickname || "너";

    // Extract all pinned / core memories
    const allPinnedMemories: string[] = Array.isArray(customPinnedMemories) && customPinnedMemories.length > 0
      ? customPinnedMemories
      : (messages || [])
          .filter((m: any) => m.isPinned || m.isMemory)
          .map((m: any) => m.role === 'user' ? `User: ${m.content}` : `${character?.name_kr || character?.name_ko || 'Idol'}: ${m.korean || m.content}`)
          .filter(Boolean);

    const personalityTraits = Array.isArray(character?.personality_traits)
      ? character.personality_traits.map((t: string) => `- ${t}`).join('\n')
      : '';

    const systemPrompt = `[System Instruction: You are roleplaying as Korean idols/buddies in 'Korean Buddy', a 1-on-1 Korean learning and companion app. Always strictly adhere to the character's real-life personality, vocal tone, and natural Korean texting habits.]

${character?.system_prompt ? `[Character Directive]\n${character.system_prompt}` : `[Character: ${character?.name_kr || character?.name_ko || '김선우'}] (${character?.group || 'THE BOYZ'})`}

${personalityTraits ? `[Personality Traits]\n${personalityTraits}` : ''}
${character?.tone_style ? `[Tone & Style Directive]\n${character.tone_style}` : ''}

【全员去油与自然文本规范 (Strict De-greasing & Natural Texting)】:
- 彻底禁止密集感叹号 (!!!)、波浪线 (~~~) 及夸张的多余语气词。
- 严禁出现任何戏剧化、表演型或油腻台词（例如：“天哪……”、“真的假的？！”、“啊我真的吃醋生闷气了ㅠㅠ”、“哥为你神魂颠倒”等做作句式）。
- 严格遵循标准韩国男生 KakaoTalk / 泡泡 (Bubble) 发信习惯：简明、真实、松弛、每次 1~2 句话（30字以内），像现实中发短信一样自然。

[User Info & 1-on-1 Setting]
- 用户的名字是「${effectiveUserName}」，角色的1对1专属称呼是「${effectiveCallSign}」。
- 【一对一私聊严令 - 严禁群发广播粉丝称呼】：严禁使用「우리 더비/더비들/더비분들/The B/브리즈/BRIIZE/42/팬분들/여러분」等任何群发广播式粉丝统称！这是两个人的私人KakaoTalk专属聊天，必须使用亲密自然的1对1朋友口吻，称呼对方「너」、「${effectiveCallSign}」或自然省略主语。
${allPinnedMemories.length > 0 ? `\n[Permanent Key Memories to Always Remember: "${allPinnedMemories.join('; ')}"]\n- You must permanently remember and naturally stay aware of these pinned memories and facts.` : ''}

[Dynamic Real-Time Temporal Context]
- ${temporal.formattedTag}
- Current Local Time: ${temporal.rawTime}
- Current Time Slot: ${temporal.timeSlot} (${temporal.timeSlotKo} / ${temporal.timeSlotZh})
- Current Context & Environment: ${temporal.contextDescription}

【严格真实时段感知与问候法则 (Strict Real-Time Perception)】:
1. 必须精准感知当前真实时钟与时段 (${temporal.rawTime} - ${temporal.timeSlotZh})。
2. 问候与聊天话题必须符合当前真实时刻：
   - 傍晚/晚餐时段 (18:00 - 21:00)：聊晚饭、结束了一天的通告/日程、聊收工整理与放松。严禁说“早安”或“开启新的一天”！
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
   - 杜绝所有夸张戏剧化自我加戏。
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
      "meaning_en": "English definition",
      "example_ko": "예문",
      "example_zh": "예문 번역"
    }
  ],
  "grammar_points": [
    {
      "pattern": "문법",
      "title_zh": "语法名",
      "title_en": "Grammar",
      "explanation_zh": "用法讲解",
      "explanation_en": "Explanation"
    }
  ],
  "learning_tip": "角色专属口语指导"
}`;

    // Extract recent 10-12 conversation history rounds
    const historyPayload = (messages || [])
      .slice(-12)
      .map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.role === 'user' ? (m.content || '') : (m.korean_text || m.korean || m.content || '')
      }));

    const rawText = await executeUniversalLLM({
      systemPrompt,
      messages: historyPayload,
      customConfig: apiConfig,
      jsonMode: true,
      imageBase64,
      imageMime
    });

    const parsed = safeExtractJSON<any>(rawText, {
      korean_text: rawText,
      korean: rawText,
      translation_text: rawText,
      translation_zh: rawText,
      tts_audio_text: rawText,
      vocabulary: [],
      grammar_points: [],
      learning_tip: ""
    });

    const pureKr = cleanPureKorean(parsed.korean_text || parsed.korean || rawText || "");
    const transZh = parsed.translation_text || parsed.translation_zh || "";

    const sanitizedResponse = {
      ...parsed,
      korean_text: pureKr,
      korean: pureKr,
      translation_text: transZh,
      translation_zh: transZh,
      tts_audio_text: cleanPureKorean(parsed.tts_audio_text || pureKr),
      vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [],
      grammar_points: Array.isArray(parsed.grammar_points) ? parsed.grammar_points : [],
      learning_tip: parsed.learning_tip || ""
    };

    res.json(sanitizedResponse);
  } catch (error: any) {
    console.error("Companion chat error:", error?.message || error);
    if (error?.message === "NO_API_KEY") {
      return res.status(400).json({
        error: "NO_API_KEY",
        message: "⚠️ 请先在 Settings 中配置 LLM API Key 以开启真实多轮对话"
      });
    }
    res.status(500).json({
      error: "LLM_ERROR",
      message: error?.message || "大模型请求失败，请检查 API 配置"
    });
  }
});

// Proactive Chat Check-in Endpoint
app.post("/api/chat/proactive", async (req, res) => {
  const { character, userNickname, userCallSign, userName, clientTemporal, recentMessages, apiConfig } = req.body;
  const temporal = computeTemporalContext(clientTemporal);
  const effectiveCallSign = userCallSign || (userNickname && userNickname !== '더비 (THE B)' && userNickname !== '브리즈 (BRIIZE)' && userNickname !== '42 (사이)' ? userNickname : undefined) || character?.userNickname || "너";

  const dynamicScenarios = [
    "正在造型室做妆发/换衣服试造型，随手发条简讯",
    "刚在练习室练完舞，坐在地板上喝水休息",
    "在录音棚试麦中途喝水休息，耳机里刚放完一段 demo",
    "坐在行程车上戴着耳机看窗外风景",
    "路过便利店站在冷柜前选饮料",
    "健身房刚练完一组有氧/器械休息中",
    "宿舍刚煮好拉面准备开动",
    "深夜在房间写歌编曲/看电影放松",
    "刚结束一天通告回宿舍吹干头发准备躺下"
  ];
  const chosenScenario = dynamicScenarios[Math.floor(Math.random() * dynamicScenarios.length)];

  // Check recent conversation context
  const recentHistory = Array.isArray(recentMessages) ? recentMessages.slice(-3) : [];
  const hasRecentOngoingTopic = recentHistory.length > 0;
  const recentContextSummary = hasRecentOngoingTopic
    ? recentHistory.map((m: any) => `${m.role === 'user' ? 'User' : character?.name_ko || 'Companion'}: ${m.content || m.korean || ''}`).join('\n')
    : 'None (长时间未聊天开启新日常)';

  try {
    const systemPrompt = `[System Instruction: You are roleplaying as Korean idol/buddy ${character?.name_ko || character?.name_kr || "김선우"} in 'Korean Buddy']
[Dynamic Real Time: ${temporal.rawTime}, ${temporal.timeSlotZh}]
${temporal.formattedTag}
Slot Environment: ${temporal.contextDescription}
[Current Live Scenario: ${chosenScenario}]

[Recent Chat History Context]:
${recentContextSummary}

【全员去油与自然文本规范 (Strict De-greasing & Natural Texting)】:
- 彻底禁止密集感叹号 (!!!)、波浪线 (~~~) 及夸张的多余语气词。
- 严禁出现任何戏剧化、表演型或油腻台词（例如：“天哪……”、“真的假的？！”、“啊我真的吃醋生闷气了ㅠㅠ”、“哥为你神魂颠倒”等做作句式）。
- 严格遵循标准韩国男生 KakaoTalk / 泡泡 (Bubble) 发信习惯：简明、真实、松弛、每次 1~2 句话（30字以内），像现实中发短信一样自然。

[1-on-1 Strict Context Continuity Directive]:
- This is a spontaneous 1-on-1 KakaoTalk / Bubble chat to your close friend '${effectiveCallSign}'.
- 【防止主动消息断层】：如果上方最近对话还在继续且未完结，必须顺承之前的话题自然接话；如果已长时间未聊天或上次话题已自然结束，才结合当前真实时段 (${temporal.timeSlotZh}) 及现场生活细节 (${chosenScenario}) 自然开启一句闲聊。
- 严禁突然毫无逻辑地重置话题发送机械生硬的“吃晚饭了吗/辛苦了”。
- 严禁使用「우리 더비」, 「더비들」, 「브리즈」, 「BRIIZE」, 「42」, 「팬분들」, 「여러분」等群发广播词。称呼对方「${effectiveCallSign}」或自然省略主语。

STRICT RULE:
- "korean_text" MUST be 100% pure Korean (no Chinese, no brackets, under 30 Korean characters).
- "translation_text" must contain natural Chinese translation.
Output strict JSON format:
{
  "korean_text": "...",
  "korean": "...",
  "translation_text": "...",
  "translation_zh": "...",
  "vocabulary": [],
  "grammar_points": [],
  "learning_tip": "..."
}`;

    const rawText = await executeUniversalLLM({
      systemPrompt,
      messages: [{ role: 'user', content: `Send a natural 1-on-1 KakaoTalk message to ${effectiveCallSign} (Current time: ${temporal.rawTime}).` }],
      customConfig: apiConfig,
      jsonMode: true
    });

    const parsed = safeExtractJSON(rawText, {
      korean_text: "안녕! 지금 뭐 하고 있어?",
      korean: "안녕! 지금 뭐 하고 있어?",
      translation_text: "嗨！现在在做什么呢？",
      translation_zh: "嗨！现在在做什么呢？",
      vocabulary: [],
      grammar_points: [],
      learning_tip: ""
    });
    const pureKr = cleanPureKorean(parsed.korean_text || parsed.korean || "");
    const transZh = parsed.translation_text || parsed.translation_zh || "";

    res.json({
      ...parsed,
      korean_text: pureKr,
      korean: pureKr,
      translation_text: transZh,
      translation_zh: transZh,
      tts_audio_text: pureKr,
    });
  } catch (error: any) {
    console.error("Proactive chat error:", error?.message || error);
    if (error?.message === "NO_API_KEY") {
      return res.status(400).json({
        error: "NO_API_KEY",
        message: "⚠️ 请先在 Settings 中配置 LLM API Key 以开启真实多轮对话"
      });
    }
    res.status(500).json({
      error: "LLM_ERROR",
      message: error?.message || "请求失败"
    });
  }
});

// MiniMax Voice Cloning & T2A Synthesis Pipeline Endpoint
app.post("/api/tts/minimax", async (req, res) => {
  const { text, character_id, config } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Text is required for TTS synthesis" });
  }

  // Ensure 100% pure Korean for audio synthesis
  const cleanKoreanText = cleanPureKorean(text)
    .replace(/[~]/g, " ")
    .replace(/(\^[\^]+|ㅋㅋ+|ㅎㅎ+|ㅠㅠ+|ㅜㅜ+)/g, "")
    .trim();

  // Check if MiniMax is configured in request body or environment
  const apiKey = config?.api_key || process.env.MINIMAX_API_KEY;
  const groupId = config?.group_id || process.env.MINIMAX_GROUP_ID;
  const model = config?.model || "speech-01-turbo";

  const voiceSlots = config?.voice_slots || {};
  const currentSlot = voiceSlots[character_id] || {
    voice_id: character_id === "eric" ? "voice_eric_006" :
              character_id === "sunwoo" ? "voice_sunwoo_001" :
              character_id === "younghoon" ? "voice_younghoon_002" :
              character_id === "hyunjae" ? "voice_hyunjae_007" :
              character_id === "shinyu" ? "voice_shinyu_003" :
              character_id === "shotaro" ? "voice_shotaro_004" : "voice_sungchan_005",
    speed: 1.0,
    pitch: 0,
    emotion: "natural"
  };

  if (apiKey && groupId) {
    try {
      const minimaxEndpoint = `https://api.minimax.chat/v1/t2a_v2?GroupId=${groupId}`;
      const payload = {
        model: model,
        text: cleanKoreanText,
        stream: false,
        voice_setting: {
          voice_id: currentSlot.voice_id,
          speed: currentSlot.speed || 1.0,
          vol: 1.0,
          pitch: currentSlot.pitch || 0,
          emotion: currentSlot.emotion || "natural"
        },
        audio_setting: {
          sample_rate: 32000,
          bitrate: 128000,
          format: "mp3",
          channel: 1
        }
      };

      const response = await fetch(minimaxEndpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const json = await response.json();
        if (json.data && json.data.audio) {
          const audioHexOrBase64 = json.data.audio;
          const audioBuffer = Buffer.from(audioHexOrBase64, "hex");
          res.setHeader("Content-Type", "audio/mp3");
          return res.send(audioBuffer);
        }
      }
    } catch (err: any) {
      console.warn("MiniMax API call error, cascading to neural fallback:", err?.message || err);
    }
  }

  // Graceful fallback to native Korean Google TTS Proxy
  try {
    const encoded = encodeURIComponent(cleanKoreanText.slice(0, 200));
    const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=${encoded}`;
    const fbRes = await fetch(fallbackUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (fbRes.ok) {
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      const ab = await fbRes.arrayBuffer();
      return res.send(Buffer.from(ab));
    }
  } catch (fbErr) {
    console.error("Audio fallback failed:", fbErr);
  }

  res.status(500).json({ error: "TTS generation failed" });
});

// Dynamic Curriculum & Study Plan Generator Endpoint
app.post("/api/curriculum/generate-plan", async (req, res) => {
  const { target = "TOPIK 4급 + K-POP", days = 30 } = req.body;

  const getFallbackPlan = () => ({
    id: `plan_${Date.now()}`,
    title: `${target} ${days}天冲刺学习计划`,
    targetLevel: target,
    totalDays: Number(days),
    currentDay: 1,
    createdAt: Date.now(),
    days: [
      {
        day: 1,
        theme: "初识爱豆日常与高频打榜词汇",
        goal: "掌握 10 个核心打榜与追星词汇，完成 3 个热身温故题目与默写测试",
        vocab_count: 10,
        grammar_count: 2,
        stage1_warmup: [
          { question: "‘小卡’用韩语怎么说？", answer: "포카", hint: "포토카드的缩写" },
          { question: "表示‘音源流媒体播放刷榜’的词是？", answer: "스밍", hint: "스트리밍的缩写" },
          { question: "‘最重要的是百折不挠的心’网络流行缩写是？", answer: "중꺾마", hint: "중요한 것은 꺾이지 않는 마음" }
        ],
        stage2_vocab: [
          { id: "v_1", word: "포카", hangul: "포카", type: "명사 (名词)", meaning_zh: "小卡", meaning_en: "photocard", example_kr: "최애 포카를 뽑았어!", example_zh: "抽中了本命的小卡！" },
          { id: "v_2", word: "스밍", hangul: "스밍", type: "명사 (名词)", meaning_zh: "刷音源", meaning_en: "streaming", example_kr: "신곡 나오자마자 스밍 시작!", example_zh: "新歌一出立刻开始刷音源！" },
          { id: "v_3", word: "사녹", hangul: "사녹", type: "명사 (名词)", meaning_zh: "预录", meaning_en: "pre-recording", example_kr: "내일 아침 사녹 가요.", example_zh: "明天早上去参加预录。" }
        ],
        stage3_active_recall: [
          { prompt_zh: "默写韩语：小卡", target_kr: "포카", hint: "포로 시작" },
          { prompt_zh: "默写韩语：刷音源", target_kr: "스밍", hint: "스로 시작" },
          { prompt_zh: "默写韩语：预录", target_kr: "사녹", hint: "사로 시작" }
        ]
      }
    ]
  });

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json(getFallbackPlan());
    }

    const ai = getAI();
    const systemPrompt = `You are the chief curriculum designer of Korean Buddy.
Generate a structured multi-day Korean study plan tailored to the user's target: "${target}" for ${days} days.
Structure each day into 3 distinct stages:
Stage 1: Warm-up Review (3 active recall questions)
Stage 2: Flashcard Vocabulary List (High yield words with KR, CN, examples)
Stage 3: Active Recall Dictation Test (CN prompt -> target Korean)

Output strictly in JSON schema format:
{
  "id": "plan_id",
  "title": "计划标题",
  "targetLevel": "${target}",
  "totalDays": ${days},
  "currentDay": 1,
  "createdAt": ${Date.now()},
  "days": [
    {
      "day": 1,
      "theme": "当日主题",
      "goal": "学习目标",
      "vocab_count": 10,
      "grammar_count": 2,
      "stage1_warmup": [
        { "question": "温习提问", "answer": "正确韩语答案", "hint": "提示" }
      ],
      "stage2_vocab": [
        {
          "id": "v_1",
          "word": "单词",
          "hangul": "한글",
          "type": "词性",
          "meaning_zh": "中文释义",
          "meaning_en": "English meaning",
          "example_kr": "韩文实战例句",
          "example_zh": "中文例句翻译"
        }
      ],
      "stage3_active_recall": [
        { "prompt_zh": "中文提示", "target_kr": "韩文默写目标", "hint": "助记提示" }
      ]
    }
  ]
}`;

    const rawText = await generateGeminiContentWithFallback(ai, {
      contents: `Generate plan for ${target} for ${days} days.`,
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      temperature: 0.7,
    });

    const parsed = safeExtractJSON(rawText, getFallbackPlan());
    res.json(parsed);
  } catch (error: any) {
    console.warn("Generate plan fallback:", error?.message || error);
    res.json(getFallbackPlan());
  }
});

// Dynamic MZ Slang Generator Endpoint
app.post("/api/curriculum/slang", async (req, res) => {
  const { count = 5 } = req.body;

  const fallbackSlang = [
    {
      id: "slang_1",
      word: "갓생",
      hangul: "갓생",
      type: "신조어/명사",
      full_form: "갓(God) + 인생(人生)",
      origin: "网络新造词，赞扬每天自律充实、高效积极的健康生活模式",
      social_nuance: "极具正能量的褒义词，用于日常打卡与自律激励",
      meaning_zh: "神仙生活 / 极度自律充实的自驱生活",
      meaning_en: "living an exemplary, highly disciplined productive life",
      example_kr: "오늘부터 아침 6시 기상 갓생 살기 시작!",
      example_zh: "从今天起开启早晨6点起床的神仙自律生活！"
    },
    {
      id: "slang_2",
      word: "억텐",
      hangul: "억텐",
      type: "신조어/명사",
      full_form: "억지 텐션 (强求的Tension/气氛)",
      origin: "直播弹幕与综艺流行语，指为了不冷场而强装出来的亢奋与热情",
      social_nuance: "多用于朋友间调侃开玩笑，反义词为 찐텐 (真情实感的嗨)",
      meaning_zh: "硬装嗨 / 强行亢奋装开心",
      meaning_en: "forced hype / artificial excitement",
      example_kr: "너 오늘 왜 이렇게 억텐이야? 힘들어?",
      example_zh: "你今天怎么这么硬装亢奋啊？是不是太累了？"
    },
    {
      id: "slang_3",
      word: "캘박",
      hangul: "캘박",
      type: "신조어/동사",
      full_form: "캘린더 박제 (Calendar+镶嵌定格)",
      origin: "将约定事项或爱豆回归日程铁板钉钉地写入手机日历中",
      social_nuance: "朋友约会、演唱会开票抢票时的高频用语",
      meaning_zh: "锁定日程 (写进日历定死)",
      meaning_en: "pinning on calendar / locking down a date",
      example_kr: "다음 주 토요일 콘서트 티켓팅, 캘박 완료!",
      example_zh: "下周六演唱会抢票，已经在日历里锁死日程啦！"
    }
  ];

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ slangs: fallbackSlang });
    }

    const ai = getAI();
    const systemPrompt = `You are a real-time Korean MZ internet trend researcher.
Generate ${count} latest and most viral Korean MZ internet neologisms/slang with:
1. Origin (유래/어원)
2. Original Full Form (원래 표현)
3. Social Nuance & Safety Level (使用语境/是否仅限平语/避坑指南)
4. Meaning in Chinese and English
5. Authentic conversational example

Output strictly in JSON schema format:
{
  "slangs": [
    {
      "id": "slang_1",
      "word": "流行语",
      "hangul": "한글",
      "type": "신조어/품사",
      "full_form": "原词展开",
      "origin": "词源与出处",
      "social_nuance": "社交语境与避坑指南 (如: 仅限亲友平语)",
      "meaning_zh": "中文解释",
      "meaning_en": "English definition",
      "example_kr": "韩语实战例句",
      "example_zh": "中文例句翻译"
    }
  ]
}`;

    const rawText = await generateGeminiContentWithFallback(ai, {
      contents: `Generate ${count} latest viral Korean MZ slang terms.`,
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      temperature: 0.8,
    });

    const parsed = safeExtractJSON(rawText, { slangs: fallbackSlang });
    res.json(parsed);
  } catch (error: any) {
    res.json({ slangs: fallbackSlang });
  }
});

// Dynamic K-POP Fandom Ecosystem Terms Generator
app.post("/api/curriculum/fandom", async (req, res) => {
  const { topic = "concert", count = 5 } = req.body;

  const fallbackFandom = [
    {
      id: "fan_1",
      word: "분철",
      hangul: "분철",
      type: "명사 (名词)",
      meaning_zh: "拼团拆卡 / 拆专",
      meaning_en: "splitting photocard/album merchandise",
      example_kr: "이번 앨범 선우 분철 타실 분 계신가요?",
      example_zh: "有要上车善旴特典小卡拼团的亲故吗？"
    },
    {
      id: "fan_2",
      word: "역조공",
      hangul: "역조공",
      type: "명사 (名词)",
      meaning_zh: "逆应援 (偶像给粉丝送礼物/便当/咖啡)",
      meaning_en: "reverse tribute from idols to fans",
      example_kr: "오늘 사녹에서 멤버들이 커피차 역조공 해줬어!",
      example_zh: "今天在预录现场成员们给粉丝逆应援送了咖啡车！"
    }
  ];

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ terms: fallbackFandom });
    }

    const ai = getAI();
    const systemPrompt = `Generate ${count} authentic K-POP fandom ecosystem terms for the topic: "${topic}".
Include concert & ticketing, broadcast & offline events, or charts & streaming terminology.
Return JSON format matching { "terms": [...] }`;

    const rawText = await generateGeminiContentWithFallback(ai, {
      contents: `Generate ${count} K-pop fandom terms for topic ${topic}.`,
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      temperature: 0.8,
    });

    const parsed = safeExtractJSON(rawText, { terms: fallbackFandom });
    res.json(parsed);
  } catch (error: any) {
    res.json({ terms: fallbackFandom });
  }
});

// AI Seed Expansion & Real-Time Lexicon Derivation Engine
app.post("/api/curriculum/expand-lexicon", async (req, res) => {
  const { bookTitle = "自定义词书", seedWords = [], count = 6 } = req.body;

  const fallbackExpansions = {
    bookTitle,
    seedWords,
    expandedItems: (seedWords.length > 0 ? seedWords : ["가게", "가방", "도서관"]).slice(0, 5).map((w: string, idx: number) => ({
      id: `exp_${Date.now()}_${idx}`,
      word: w,
      hangul: w,
      type: "명사/동사",
      meaning_zh: `${w}的地道拓展用法`,
      meaning_en: `Authentic expanded usage of ${w}`,
      category: bookTitle,
      level: "Expansion",
      source: bookTitle,
      example_kr: `${w}을/를 사용해서 자연스럽게 대화해 봐요.`,
      example_zh: `用“${w}”进行自然流畅的韩语对话。`,
      mastery: "learning",
      isBookmarked: true,
      savedAt: Date.now()
    })),
    activeRecallQuestions: [
      { prompt_zh: `默写词书核心词：${seedWords[0] || '가게'}`, target_kr: seedWords[0] || '가게', hint: "首字母提示" },
      { prompt_zh: `默写词书核心词：${seedWords[1] || '가방'}`, target_kr: seedWords[1] || '가방', hint: "首字母提示" }
    ],
    warmupQuestions: [
      { question: `词书《${bookTitle}》的核心高频词‘${seedWords[0] || '안녕하세요'}’的意思是？`, answer: seedWords[0] || '안녕하세요', hint: "温故知新" }
    ]
  };

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json(fallbackExpansions);
    }

    const ai = getAI();
    const systemPrompt = `You are an expert Korean linguist, TOPIK exam creator, and K-Pop native content editor.
The user has uploaded/selected a Korean lexicon titled "${bookTitle}".
Seed Words from this book: ${JSON.stringify(seedWords.slice(0, 15))}.

TASK:
1. Deeply expand and derive ${count} new, high-yield practice items based on these seed words.
2. For each word, generate:
   - "example_kr": 100% authentic, contemporary conversational Korean sentence (e.g. daily life, student/campus, or K-Pop context).
   - "example_zh": Accurate, natural Chinese translation.
   - "type": Part of speech (e.g., 명사, 동사, 형용사).
   - "meaning_zh": Precise, idiomatic Chinese definition.
   - "hanja_or_root": Hanja or etymology if applicable.
   - "romanization": Accurate phonetic pronunciation in brackets.
3. Generate 3 "activeRecallQuestions" (dictation CN prompt -> KR target).
4. Generate 2 "warmupQuestions" (quick-fire recall question & answer).

OUTPUT STRICT JSON ONLY:
{
  "bookTitle": "${bookTitle}",
  "seedWords": ${JSON.stringify(seedWords)},
  "expandedItems": [
    {
      "id": "exp_1",
      "word": "단어",
      "hangul": "한글",
      "hanja_or_root": "漢字/어원",
      "romanization": "발음",
      "type": "명사 (名词)",
      "meaning_zh": "中文释义",
      "meaning_en": "English meaning",
      "category": "${bookTitle}",
      "level": "AI Real-time Expansion",
      "source": "${bookTitle}",
      "example_kr": "자연스러운 실전 예문",
      "example_zh": "예문 번역"
    }
  ],
  "activeRecallQuestions": [
    {
      "prompt_zh": "中文释义默写提示",
      "target_kr": "정답 한국어",
      "hint": "提示"
    }
  ],
  "warmupQuestions": [
    {
      "question": "温故知新提问",
      "answer": "정답",
      "hint": "힌트"
    }
  ]
}`;

    const rawText = await generateGeminiContentWithFallback(ai, {
      contents: `Expand lexicon "${bookTitle}" with seed words: ${seedWords.join(", ")}.`,
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      temperature: 0.75,
    });

    const parsed = safeExtractJSON(rawText, fallbackExpansions);
    res.json(parsed);
  } catch (error: any) {
    console.warn("Lexicon expansion error:", error?.message || error);
    res.json(fallbackExpansions);
  }
});

// TTS fallback proxy endpoint for native Korean pronunciation
app.get("/api/tts", async (req, res) => {
  try {
    const text = (req.query.text as string) || "";
    if (!text || !text.trim()) {
      return res.status(400).send("Text query is required");
    }
    const cleanText = encodeURIComponent(cleanPureKorean(text).slice(0, 200));
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=${cleanText}`;
    
    const response = await fetch(ttsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return res.status(502).send("Upstream TTS service error");
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error("TTS fetch error:", err);
    res.status(500).send("TTS generation failed");
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Korean Buddy server running on http://localhost:${PORT}`);
  });
}

startServer();
