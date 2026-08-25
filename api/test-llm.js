/**
 * Vercel Serverless Function: /api/test-llm
 * Tests API Key validity safely on the server side without leaking credentials.
 */

export default async function handler(req, res) {
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
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { provider, apiKey: clientKey, model, baseURL } = req.body || {};

    const effectiveKey = (clientKey && String(clientKey).trim().length > 0)
      ? String(clientKey).trim()
      : (process.env.GEMINI_API_KEY || "");

    if (!effectiveKey) {
      return res.status(400).json({
        ok: false,
        error: "未提供 API Key，且 Vercel 环境变量中未设置 GEMINI_API_KEY。",
      });
    }

    // Direct test to Google Generative Language API with all auth strategies
    const strategies = [
      {
        headers: { "x-goog-api-key": effectiveKey },
        url: `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(effectiveKey)}`
      },
      {
        headers: { "Authorization": `Bearer ${effectiveKey}` },
        url: `https://generativelanguage.googleapis.com/v1beta/models`
      },
      {
        headers: { "x-goog-api-key": effectiveKey },
        url: `https://generativelanguage.googleapis.com/v1beta/models`
      }
    ];

    let lastError = null;
    for (const strat of strategies) {
      try {
        const testResp = await fetch(strat.url, {
          method: "GET",
          headers: strat.headers,
        });

        if (testResp.ok) {
          const data = await testResp.json();
          const modelCount = data.models ? data.models.length : 0;
          return res.status(200).json({
            ok: true,
            message: `Google Gemini 官方 API 连接成功！已检测到 ${modelCount} 个可用模型。`,
            provider: provider || "gemini",
            model: model || "gemini-2.5-flash",
          });
        }

        const errText = await testResp.text();
        let parsed;
        try { parsed = JSON.parse(errText); } catch {}
        const code = parsed?.error?.code || testResp.status;
        const msg = parsed?.error?.message || errText;
        lastError = new Error(`Google Gemini 鉴权响应 (${code}): ${msg}`);
      } catch (err) {
        lastError = err;
      }
    }

    return res.status(401).json({
      ok: false,
      error: lastError?.message || "Google Gemini 鉴权失败：API Key 无效或未开通权限。",
    });
  } catch (error) {
    console.error("Test LLM Vercel error:", error);
    return res.status(500).json({
      ok: false,
      error: error?.message || "连接测试出现异常",
    });
  }
}
