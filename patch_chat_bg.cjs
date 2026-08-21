const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

text = text.replace(
  "${theme === 'kkt' ? 'bg-[#b2c7d9]' : 'rounded-2xl sm:rounded-3xl bg-[#F0EDE6] border border-[#E0DED7] shadow-inner'}",
  "${theme === 'kkt' ? 'bg-[#b2c7d9]' : theme === 'wechat' ? 'bg-[#EDEDED]' : 'rounded-2xl sm:rounded-3xl bg-[#F0EDE6] border border-[#E0DED7] shadow-inner'}"
);

fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
