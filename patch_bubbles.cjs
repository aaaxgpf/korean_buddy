const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

const regex = /className=\{\`relative p-3\.5 sm:p-4 transition-all \$\{\n\s*isUser\n\s*\? 'bg-\\[#FEE500\\] text-\\[#191919\\] rounded-2xl rounded-tr-xs shadow-xs font-sans font-medium'\n\s*: 'bg-white text-\\[#2D2D2D\\] rounded-2xl rounded-tl-xs border border-\\[#E0DED7\\] shadow-xs'\n\s*\}\`\}/s;

const replacement = "className={`relative p-3.5 sm:p-4 transition-all ${\n  isUser\n    ? (theme === 'kkt' ? 'bg-[#FEE500] text-[#191919] rounded-2xl rounded-tr-sm shadow-sm font-sans font-medium' : theme === 'wechat' ? 'bg-[#95EC69] text-black rounded-lg rounded-tr-sm shadow-sm' : 'bg-stone-800 text-white rounded-2xl rounded-tr-sm shadow-sm')\n    : (theme === 'wechat' ? 'bg-white text-[#2D2D2D] rounded-lg rounded-tl-sm shadow-sm' : 'bg-white text-[#2D2D2D] rounded-2xl rounded-tl-sm border border-[#E0DED7] shadow-sm')\n}`}";

text = text.replace(regex, replacement);

fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
