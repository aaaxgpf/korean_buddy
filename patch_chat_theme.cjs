const fs = require('fs');

let code = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

// Add theme prop to interface
code = code.replace(/interface CompanionChatProps \{/, `interface CompanionChatProps {\n  theme?: 'default' | 'kkt';`);

// Add theme to component props
code = code.replace(/onBack,\n  companion,/, `onBack,\n  theme = 'default',\n  companion,`);

// Update outer container background depending on theme
code = code.replace(/className="flex flex-col h-full bg-\[#b2c7d9\] w-full max-w-2xl mx-auto relative overflow-hidden shadow-lg border-x border-\[#9bbbd4\]"/,
  `className={\`flex flex-col h-full w-full max-w-2xl mx-auto relative overflow-hidden \${theme === 'kkt' ? 'bg-[#b2c7d9] shadow-lg border-x border-[#9bbbd4]' : 'bg-[#FAF9F6] border-x border-stone-200'}\`}`
);

// Update Header background
code = code.replace(/className="bg-\[#b2c7d9\]\/95 backdrop-blur-md px-4 py-3 flex flex-col gap-2 z-10 shrink-0"/,
  `className={\`\${theme === 'kkt' ? 'bg-[#b2c7d9]/95 border-b border-[#9bbbd4]' : 'bg-[#FAF9F6]/95 border-b border-stone-200'} backdrop-blur-md px-4 py-3 flex flex-col gap-2 z-10 shrink-0\`}`
);

// Update Header Text colors
code = code.replace(/<span className="font-bold text-\[17px\] text-\[#3E2723\] leading-tight tracking-tight">/,
  `<span className={\`font-bold text-[17px] leading-tight tracking-tight \${theme === 'kkt' ? 'text-[#3E2723]' : 'text-stone-800'}\`}>`
);
code = code.replace(/<span className="text-\[12px\] text-\[#3E2723\]\/60 font-medium truncate max-w-\[200px\]">/,
  `<span className={\`text-[12px] font-medium truncate max-w-[200px] \${theme === 'kkt' ? 'text-[#3E2723]/60' : 'text-stone-500'}\`}>`
);
code = code.replace(/<span className="text-\[10px\] font-semibold bg-white\/40 text-\[#3E2723\] px-1\.5 py-0\.5 rounded-md shadow-sm">/,
  `<span className={\`text-[10px] font-semibold px-1.5 py-0.5 rounded-md shadow-sm \${theme === 'kkt' ? 'bg-white/40 text-[#3E2723]' : 'bg-stone-200 text-stone-700'}\`}>`
);

// Update Main Chat Scroll Container background
code = code.replace(/className="flex-1 overflow-y-auto space-y-4 p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-\[#F0EDE6\] border border-\[#E0DED7\] shadow-inner"/,
  `className={\`flex-1 overflow-y-auto space-y-4 p-3 sm:p-4 \${theme === 'kkt' ? 'bg-[#b2c7d9]' : 'rounded-2xl sm:rounded-3xl bg-[#F0EDE6] border border-[#E0DED7] shadow-inner'}\`}`
);

// Remove the radial gradient if theme is KKT (optional, but wait, the radial gradient is inline style)
// We will just remove it entirely or make it conditional.
code = code.replace(/style=\{\{ backgroundImage: 'radial-gradient\(\[#E0DED7 1px, transparent 1px\)', backgroundSize: '24px 24px' \}\}/g, 
  `style={theme === 'default' ? { backgroundImage: 'radial-gradient(#E0DED7 1px, transparent 1px)', backgroundSize: '24px 24px' } : undefined}`
);

// Update Bubbles
code = code.replace(/<div className=\{\`relative px-3 py-2 sm:px-4 sm:py-2\.5 text-\[15px\] leading-relaxed shadow-sm flex flex-col gap-1 \$\{/,
  `<div className={\`relative px-3 py-2 sm:px-4 sm:py-2.5 text-[15px] leading-relaxed shadow-sm flex flex-col gap-1 \${`
);
// We need to carefully replace the bubble color classes based on theme.
// Let's find the exact bubble class string.
const bubbleClassRegex = /isUser \? 'bg-\[#FFEB3B\] text-\[#3E2723\] rounded-\[20px\] rounded-tr-\[4px\]' : 'bg-white text-\[#3E2723\] rounded-\[20px\] rounded-tl-\[4px\]'/;
const bubbleClassReplacement = `isUser ? (theme === 'kkt' ? 'bg-[#FFEB3B] text-[#3E2723] rounded-[20px] rounded-tr-[4px]' : 'bg-amber-100 text-stone-800 rounded-[20px] rounded-tr-[4px]') : (theme === 'kkt' ? 'bg-white text-[#3E2723] rounded-[20px] rounded-tl-[4px]' : 'bg-white text-stone-800 rounded-[20px] rounded-tl-[4px] border border-stone-100')`;
code = code.replace(bubbleClassRegex, bubbleClassReplacement);

// Input Area Background
code = code.replace(/<div className="bg-white\/80 backdrop-blur-xl border-t border-\[#9BB3C7\]\/50 p-2 sm:p-3 pb-6 shrink-0 relative z-20 shadow-\[0_-4px_20px_rgba\(0,0,0,0\.05\)\]">/,
  `<div className={\`\${theme === 'kkt' ? 'bg-white/80 border-[#9BB3C7]/50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]' : 'bg-white border-stone-200'} backdrop-blur-xl border-t p-2 sm:p-3 pb-6 shrink-0 relative z-20\`}>`
);

// Send Button
code = code.replace(/<button\n                  disabled=\{!inputText\.trim\(\) \|\| isLoading\}\n                  onClick=\{handleSend\}\n                  className="w-8 h-8 sm:w-9 sm:h-9 bg-\[#FFEB3B\] text-\[#3E2723\] rounded-full flex items-center justify-center disabled:opacity-50 disabled:bg-stone-200 transition-colors shadow-sm shrink-0"\n                >/,
  `<button
                  disabled={!inputText.trim() || isLoading}
                  onClick={handleSend}
                  className={\`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center disabled:opacity-50 disabled:bg-stone-200 transition-colors shadow-sm shrink-0 \${theme === 'kkt' ? 'bg-[#FFEB3B] text-[#3E2723]' : 'bg-stone-800 text-white hover:bg-stone-700'}\`}
                >`
);

fs.writeFileSync('src/components/CompanionChat.tsx', code, 'utf-8');
