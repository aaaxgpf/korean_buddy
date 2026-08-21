const fs = require('fs');

let lines = fs.readFileSync('src/App.tsx', 'utf-8').split('\n');
const insertCode = `
  // Handle Proactive Messages
  useEffect(() => {
    const activeChat = companionChatMap[currentCompanion.id];
    if (!activeChat || activeChat.length === 0) return;
    
    const lastMsg = activeChat[activeChat.length - 1];
    if (lastMsg.role === 'assistant') {
      // Simulate proactive message if user doesn't reply for a bit
      const timer = setTimeout(() => {
        const proactiveMsg = {
           id: \`proactive_\${Date.now()}\`,
           role: 'assistant',
           content: '무슨 일 있어요? 왜 대답이 없어요~ 👀',
           timestamp: Date.now(),
           korean: '무슨 일 있어요? 왜 대답이 없어요~ 👀',
           translation_zh: '有什么事吗？怎么不回答我~ 👀',
        };
        handleUpdateCompanionMessages(currentCompanion.id, prev => [...prev, proactiveMsg as any]);
      }, 15000); // 15 seconds for demo
      return () => clearTimeout(timer);
    }
  }, [companionChatMap, currentCompanion.id]);
`;

// Find index of "handleUpdateCompanionMessages"
const idx = lines.findIndex(l => l.includes('handleUpdateCompanionMessages ='));
// find the end of that function. Let's look for "  };" after idx.
let endIdx = -1;
for (let i = idx + 1; i < lines.length; i++) {
  if (lines[i] === '  };') {
    endIdx = i;
    break;
  }
}

lines.splice(endIdx + 1, 0, insertCode);
fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf-8');
