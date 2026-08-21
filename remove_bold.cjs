const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

text = text.replace(
    'font-bold text-[#1A1A1A] text-xs',
    'text-[#1A1A1A] text-xs'
);

text = text.replace(
    'font-bold text-emerald-950 font-mono',
    'text-emerald-950 font-mono'
);

fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
