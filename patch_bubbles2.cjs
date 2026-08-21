const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

const target = "isUser\n                      ? 'bg-[#FEE500] text-[#191919] rounded-2xl rounded-tr-xs shadow-xs font-sans font-medium'\n                      : 'bg-white text-[#2D2D2D] rounded-2xl rounded-tl-xs border border-[#E0DED7] shadow-xs'";

const target2 = `isUser
                      ? 'bg-[#FEE500] text-[#191919] rounded-2xl rounded-tr-xs shadow-xs font-sans font-medium'
                      : 'bg-white text-[#2D2D2D] rounded-2xl rounded-tl-xs border border-[#E0DED7] shadow-xs'`;

let replacement = `isUser 
    ? (theme === 'kkt' ? 'bg-[#FEE500] text-[#191919] rounded-2xl rounded-tr-sm shadow-sm font-sans font-medium' : theme === 'wechat' ? 'bg-[#95EC69] text-black rounded-lg rounded-tr-sm shadow-sm' : 'bg-stone-800 text-white rounded-2xl rounded-tr-sm shadow-sm') 
    : (theme === 'wechat' ? 'bg-white text-[#2D2D2D] rounded-lg rounded-tl-sm shadow-sm' : 'bg-white text-[#2D2D2D] rounded-2xl rounded-tl-sm border border-[#E0DED7] shadow-sm')`;

let updated = false;
if (text.includes(target)) {
    text = text.replace(target, replacement);
    updated = true;
} else if (text.includes(target2)) {
    text = text.replace(target2, replacement);
    updated = true;
} else {
    // let's do a fallback replace using substring search
    const startStr = "className={`relative p-3.5 sm:p-4 transition-all ${";
    const endStr = "}`}";
    const startIdx = text.indexOf(startStr);
    if (startIdx !== -1) {
        const afterStart = text.substring(startIdx + startStr.length);
        const endIdx = afterStart.indexOf(endStr);
        if (endIdx !== -1) {
            text = text.substring(0, startIdx + startStr.length) + "\n                    " + replacement + "\n                  " + text.substring(startIdx + startStr.length + endIdx);
            updated = true;
        }
    }
}

console.log("Updated:", updated);

fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
