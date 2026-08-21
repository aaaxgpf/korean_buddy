const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

// Fix the bubble class logic
const targetRegex = /className=\{\`relative p-3\.5 sm:p-4 transition-all \$\{\n\s*isUser \n\s*\? \(theme === 'kkt' \? 'bg-\\[#FEE500\\] text-\\[#191919\\] rounded-2xl rounded-tr-sm shadow-sm font-sans font-medium' : theme === 'wechat' \? 'bg-\\[#95EC69\\] text-black rounded-lg rounded-tr-sm shadow-sm' : 'bg-stone-800 text-white rounded-2xl rounded-tr-sm shadow-sm'\) \n\s*: \(theme === 'wechat' \? 'bg-white text-\\[#2D2D2D\\] rounded-lg rounded-tl-sm shadow-sm' : 'bg-white text-\\[#2D2D2D\\] rounded-2xl rounded-tl-sm border border-\\[#E0DED7\\] shadow-sm'\)\n\s*\}\`\}/;

const targetReplace = "className={`relative p-3 sm:p-3.5 transition-all ${\n  isUser\n    ? (theme === 'kkt' ? 'bg-[#FEE500] text-[#191919] rounded-2xl rounded-tr-sm shadow-sm font-sans' : theme === 'wechat' ? 'bg-[#95EC69] text-black rounded-md rounded-tr-none' : 'bg-stone-800 text-white rounded-2xl rounded-tr-sm shadow-sm')\n    : (theme === 'wechat' ? 'bg-white text-[#2D2D2D] rounded-md rounded-tl-none' : 'bg-white text-[#2D2D2D] rounded-2xl rounded-tl-sm border border-[#E0DED7] shadow-sm')\n}`}";

let updated = false;
if (targetRegex.test(text)) {
    text = text.replace(targetRegex, targetReplace);
    updated = true;
} else {
    // fallback
    const startStr = "className={`relative p-3.5 sm:p-4 transition-all ${";
    const endStr = "}`}";
    const startIdx = text.indexOf(startStr);
    if (startIdx !== -1) {
        const afterStart = text.substring(startIdx + startStr.length);
        const endIdx = afterStart.indexOf(endStr);
        if (endIdx !== -1) {
            text = text.substring(0, startIdx) + targetReplace + text.substring(startIdx + startStr.length + endIdx + endStr.length);
            updated = true;
        }
    }
}

console.log("Bubble Updated:", updated);

// Remove font-medium from the Korean/Main text
text = text.replace(
  '<p className="text-base sm:text-lg font-medium text-[#1A1A1A] leading-snug">',
  '<p className="text-base sm:text-lg text-[#1A1A1A] leading-snug">'
);

// Remove font-medium from translations
text = text.replace(
  '<p className="font-medium">{msg.translation_zh}</p>',
  '<p className="font-normal">{msg.translation_zh}</p>'
);
text = text.replace(
  '<p className="font-medium">{msg.translation_en}</p>',
  '<p className="font-normal">{msg.translation_en}</p>'
);
text = text.replace(
  '<p className="font-medium text-emerald-900 text-[11px] mt-0.5">{g.title_zh}</p>',
  '<p className="font-normal text-emerald-900 text-[11px] mt-0.5">{g.title_zh}</p>'
);


fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
