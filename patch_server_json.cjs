const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const regex = /const rawText = await generateGeminiContentWithFallback[\s\S]*?const parsed = JSON\.parse\(rawText \|\| "\{\}"\);/m;

const replacement = `const rawText = await generateGeminiContentWithFallback(ai, {
      contents: contentsPayload,
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      temperature: 0.88,
    });
    
    let parsed;
    try {
      const cleaned = (rawText || "{}").replace(/^\\s*\`\`\`[a-z]*\\s*/i, '').replace(/\\s*\`\`\`\\s*$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      // Attempt to extract JSON object if there's trailing text
      const match = rawText.match(/\\{[\\s\\S]*\\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw parseError;
      }
    }`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('server.ts', code, 'utf-8');
} else {
  console.log("Could not find match in server.ts");
}
