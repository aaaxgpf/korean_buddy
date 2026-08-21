const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

// Fix the main chat area background
text = text.replace(
  /\$\{theme === 'kkt' \? 'bg-\\[#b2c7d9\\]' : 'rounded-2xl sm:rounded-3xl bg-\\[#F0EDE6\\] border border-\\[#E0DED7\\] shadow-inner'\}/,
  "${theme === 'kkt' ? 'bg-[#b2c7d9]' : theme === 'wechat' ? 'bg-[#EDEDED]' : 'rounded-2xl sm:rounded-3xl bg-[#F0EDE6] border border-[#E0DED7] shadow-inner'}"
);

// Fix the speech bubble
text = text.replace(
  /isUser\s*\?\s*'bg-\\[#FEE500\\] text-\\[#191919\\] rounded-2xl rounded-tr-xs shadow-xs font-sans font-medium'\s*:\s*'bg-white text-\\[#2D2D2D\\] rounded-2xl rounded-tl-xs border border-\\[#E0DED7\\] shadow-xs'/s,
  `isUser 
    ? (theme === 'kkt' ? 'bg-[#FEE500] text-[#191919] rounded-2xl rounded-tr-xs shadow-sm font-sans font-medium' : theme === 'wechat' ? 'bg-[#95EC69] text-black rounded-lg rounded-tr-sm shadow-sm' : 'bg-stone-800 text-white rounded-2xl rounded-tr-sm shadow-sm') 
    : (theme === 'wechat' ? 'bg-white text-[#2D2D2D] rounded-lg rounded-tl-sm shadow-sm' : 'bg-white text-[#2D2D2D] rounded-2xl rounded-tl-sm border border-[#E0DED7] shadow-sm')`
);

fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
