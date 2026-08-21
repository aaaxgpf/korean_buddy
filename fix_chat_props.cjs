const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

text = text.replace(
  'onStartVoiceCall, theme }) => {',
  'onStartVoiceCall, theme, onOpenProfile }) => {'
);
fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
