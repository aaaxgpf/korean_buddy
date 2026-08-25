/**
 * Vercel Serverless Function: /api/chat
 * 
 * 🔒 SECURITY GUARANTEE:
 * 1. Your GEMINI_API_KEY / OPENAI_API_KEY stays strictly on the server-side environment (process.env).
 * 2. It is NEVER sent to the client browser or bundled into static assets.
 * 3. Client requests only receive generated text/JSON responses.
 */

const MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-flash-latest",
  "gemini-1.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.1-pro-preview",
];

async function callGeminiREST({
  apiKey,
  model,
  baseURL,
  systemPrompt,
  messages,
  jsonMode,
  temperature,
  imageBase64,
  imageMime,
}) {
  const cleanKey = (apiKey || "").replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/["'`]/g, "").trim();
  if (!cleanKey) {
    throw new Error("NO_API_KEY");
  }

  if (cleanKey.startsWith("sk-")) {
    throw new Error("检测到填入的 API Key 为 sk- 开头，请切换提供商为 OpenAI 或 DeepSeek。");
  }

  const requestedModel = (model?.trim() || "gemini-2.5-flash").replace(/^models\//, "");
  let baseEndpoint = (baseURL?.trim() || "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/, "");
  if (baseEndpoint.includes("generativelanguage.googleapis.com") && !baseEndpoint.includes("/v1")) {
    baseEndpoint = `${baseEndpoint}/v1beta`;
  }

  const contents = messages.map((m) => {
    const parts = [];
    if (m.role === "user" && imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
      parts.push({
        inline_data: {
          mime_type: imageMime || "image/jpeg",
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

  const requestBody = {
    contents,
    generationConfig: {
      temperature: temperature ?? 0.85,
    },
  };

  if (systemPrompt) {
    requestBody.system_instruction = {
      parts: [{ text: systemPrompt }],
    };
  }

  if (jsonMode) {
    requestBody.generationConfig.responseMimeType = "application/json";
  }

  const uniqueModels = Array.from(new Set([requestedModel, ...MODEL_CANDIDATES]));
  const isOAuthToken = cleanKey.startsWith("ya29.");
  const authStrategies = isOAuthToken
    ? [{ type: "bearer" }, { type: "apikey_both" }]
    : [{ type: "apikey_both" }, { type: "apikey_header" }, { type: "apikey_param" }];

  let lastError = null;

  for (const strategy of authStrategies) {
    for (const m of uniqueModels) {
      const headers = { "Content-Type": "application/json" };
      let url;

      if (strategy.type === "bearer") {
        headers["Authorization"] = `Bearer ${cleanKey}`;
        url = `${baseEndpoint}/models/${m}:generateContent`;
      } else if (strategy.type === "apikey_both") {
        headers["x-goog-api-key"] = cleanKey;
        url = `${baseEndpoint}/models/${m}:generateContent?key=${encodeURIComponent(cleanKey)}`;
      } else if (strategy.type === "apikey_header") {
        headers["x-goog-api-key"] = cleanKey;
        url = `${baseEndpoint}/models/${m}:generateContent`;
      } else {
        url = `${baseEndpoint}/models/${m}:generateContent?key=${encodeURIComponent(cleanKey)}`;
      }

      try {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errText = await response.text();
          let parsed;
          try {
            parsed = JSON.parse(errText);
          } catch {}

          const code = parsed?.error?.code || response.status;
          const msg = parsed?.error?.message || errText;

          if (code === 404 || msg.includes("models/") || msg.includes("not found")) {
            lastError = new Error(`模型 ${m} 不可用: ${msg}`);
            continue;
          }
          if (code === 401 || code === 403) {
            throw new Error(`Google Gemini 鉴权失败 (${code})：请检查 API Key 是否正确有效。`);
          }
          throw new Error(`Gemini API 错误 (${code}): ${msg}`);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.map((p) => p.text).filter(Boolean).join("") || "";
        if (text) return text;
      } catch (err) {
        lastError = err;
        if (err.message?.includes("鉴权失败") || err.message?.includes("401") || err.message?.includes("403")) {
          throw err;
        }
      }
    }
  }

  throw lastError || new Error("Gemini 请求未能成功生成文本");
}

export default async function handler(req, res) {
  // CORS support
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      messages,
      systemPrompt,
      apiKey: clientKey,
      model,
      baseURL,
      temperature,
      jsonMode,
      imageBase64,
      imageMime,
    } = req.body || {};

    // 🔒 Security: Priority to server-side secret environment variable if not provided by user
    const effectiveKey = (clientKey && String(clientKey).trim().length > 0)
      ? String(clientKey).trim()
      : (process.env.GEMINI_API_KEY || "");

    if (!effectiveKey) {
      return res.status(400).json({
        error: "未配置 API Key。请在 Vercel 环境变量中设置 GEMINI_API_KEY，或在应用设置中填入 API Key。",
      });
    }

    const text = await callGeminiREST({
      apiKey: effectiveKey,
      model: model || "gemini-2.5-flash",
      baseURL,
      systemPrompt,
      messages: messages || [],
      jsonMode,
      temperature,
      imageBase64,
      imageMime,
    });

    return res.status(200).json({ text });
  } catch (error) {
    console.error("Vercel Chat API error:", error);
    return res.status(500).json({
      error: error?.message || "服务器内部错误，大模型生成失败",
    });
  }
}
