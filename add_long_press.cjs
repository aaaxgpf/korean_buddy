const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

const target = "const toggleMessageSection = (msgId: string, section: 'zh' | 'en' | 'vocab' | 'grammar' | 'tip') => {";
const replacement = `let pressTimer: NodeJS.Timeout;
  const handleTouchStart = (msgId: string) => {
    pressTimer = setTimeout(() => {
      setLongPressedMsgId(prev => prev === msgId ? null : msgId);
    }, 500);
  };
  const handleTouchEnd = () => {
    clearTimeout(pressTimer);
  };

  const toggleMessageSection = (msgId: string, section: 'zh' | 'en' | 'vocab' | 'grammar' | 'tip') => {`;

text = text.replace(target, replacement);

fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
