const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldProactive = /\/\/ Handle Proactive Messages[\s\S]*?return \(\) => clearTimeout\(timer\);\n    }\n  \}, \[companionChatMap, currentCompanion\.id\]\);/;

const newProactive = `// Handle Proactive Messages
  useEffect(() => {
    const activeChat = companionChatMap[currentCompanion.id];
    if (!activeChat || activeChat.length === 0) return;
    
    const lastMsg = activeChat[activeChat.length - 1];
    if (lastMsg.role === 'assistant' && !lastMsg.id?.startsWith('proactive')) {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch('/api/chat/proactive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ character: currentCompanion, userNickname: currentCompanion.userNickname })
          });
          if (res.ok) {
            const data = await res.json();
            const proactiveMsg = {
               id: \`proactive_\${Date.now()}\`,
               role: 'assistant',
               content: data.korean || '무슨 일 있어요?',
               timestamp: Date.now(),
               korean: data.korean,
               translation_zh: data.translation_zh,
               translation_en: data.translation_en,
               vocabulary: data.vocabulary,
               grammar_points: data.grammar_points,
               learning_tip: data.learning_tip
            };
            handleUpdateCompanionMessages(currentCompanion.id, prev => [...prev, proactiveMsg as any]);
          }
        } catch (e) {
          console.error(e);
        }
      }, 5 * 60 * 1000); // 5 minutes
      return () => clearTimeout(timer);
    }
  }, [companionChatMap, currentCompanion.id, currentCompanion]);`;

if (code.match(oldProactive)) {
  code = code.replace(oldProactive, newProactive);
  fs.writeFileSync('src/App.tsx', code, 'utf-8');
} else {
  console.log("Regex didn't match. Here is the block:");
  const block = code.match(/\/\/ Handle Proactive Messages[\s\S]*?\}, \[companionChatMap, currentCompanion\.id\]\);/);
  console.log(block);
}
