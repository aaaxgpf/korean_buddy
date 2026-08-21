const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

text = text.replace(
  'bg-[#FAF9F6] border-x border-stone-200',
  'bg-transparent'
);

text = text.replace(
  'bg-[#FAF9F6]/95 border-b border-stone-200',
  'bg-transparent backdrop-blur-lg'
);

text = text.replace(
  '<span className="font-bold text-[#3E2723] text-[15px]">{companion.name_zh}</span>',
  '<span className="font-bold text-stone-800 text-lg">{companion.name_zh}</span>'
);

text = text.replace(
  'text-[#3E2723]/70 truncate max-w-[150px]',
  'text-stone-500 font-medium tracking-wide text-[11px] uppercase truncate max-w-[150px]'
);

text = text.replace(
  'className="p-2 rounded-full hover:bg-black/5 text-[#3E2723] transition-colors"',
  'className="p-2 rounded-full hover:bg-stone-100 text-stone-400 transition-colors"'
);

// We need to change the bottom chat input area to be more minimalist
text = text.replace(
  'bg-[#FAF9F6] border-t border-stone-200',
  'bg-transparent border-t border-stone-100/30'
);

// Replace button rounded-[14px] with rounded-full
text = text.replace(
  'w-10 h-10 rounded-[14px] bg-white/20 flex items-center justify-center text-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-white/30 overflow-hidden',
  'w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-xl overflow-hidden'
);

fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
