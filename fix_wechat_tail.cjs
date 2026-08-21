const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

const targetReplace = "className={`relative p-3 sm:p-3.5 transition-all ${\n  isUser\n    ? (theme === 'kkt' ? 'bg-[#FEE500] text-[#191919] rounded-2xl rounded-tr-sm shadow-sm font-sans' : theme === 'wechat' ? 'bg-[#95EC69] text-black rounded-md before:absolute before:right-[-5px] before:top-[14px] before:border-t-[5px] before:border-t-transparent before:border-b-[5px] before:border-b-transparent before:border-l-[5px] before:border-l-[#95EC69]' : 'bg-stone-800 text-white rounded-2xl rounded-tr-sm shadow-sm')\n    : (theme === 'wechat' ? 'bg-white text-[#2D2D2D] rounded-md before:absolute before:left-[-5px] before:top-[14px] before:border-t-[5px] before:border-t-transparent before:border-b-[5px] before:border-b-transparent before:border-r-[5px] before:border-r-white' : 'bg-white text-[#2D2D2D] rounded-2xl rounded-tl-sm border border-[#E0DED7] shadow-sm')\n}`}";

// Find the existing block
const startStr = "className={`relative p-3 sm:p-3.5 transition-all ${";
const endStr = "}`}";
const startIdx = text.indexOf(startStr);
if (startIdx !== -1) {
    const afterStart = text.substring(startIdx + startStr.length);
    const endIdx = afterStart.indexOf(endStr);
    if (endIdx !== -1) {
        text = text.substring(0, startIdx) + targetReplace + text.substring(startIdx + startStr.length + endIdx + endStr.length);
        console.log("Updated with tail!");
    }
}

fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
