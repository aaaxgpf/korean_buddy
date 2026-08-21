const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

text = text.replace(
  'onStartVoiceCall?: () => void;',
  'onStartVoiceCall?: () => void;\n  onOpenProfile?: () => void;'
);

text = text.replace(
  'onStartVoiceCall, theme }) => {',
  'onStartVoiceCall, theme, onOpenProfile }) => {'
);

text = text.replace(
  '<div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-xl overflow-hidden">',
  '<div onClick={onOpenProfile} className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">'
);

fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
