const fs = require('fs');
let text = fs.readFileSync('src/components/SettingsView.tsx', 'utf-8');

text = text.replace(/설정 \(Settings\)/g, "Settings");
text = text.replace(/앱 테마 \(App Theme\)/g, "App Theme");
text = text.replace(/기본 원목 \(Default\)/g, "Default (Light)");
text = text.replace(/카카오톡 \(KKT Style\)/g, "KakaoTalk");
text = text.replace(/학습 목표 \(Study Goals\)/g, "Study Goals");
text = text.replace(/일일 단어 목표 \(Daily Vocab Goal\)/g, "Daily Vocab Goal");
text = text.replace(/개/g, " words");
text = text.replace(/번역 언어 \(Translation Language\)/g, "Translation Language");
text = text.replace(/双语 \/ Bilingual/g, "Bilingual");

// Add WeChat theme button to the grid
const gridStart = text.indexOf('<div className="grid grid-cols-2 gap-4">');
if (gridStart !== -1) {
  text = text.replace('grid-cols-2', 'grid-cols-3');
  const kktButtonEnd = text.indexOf('</button>', text.indexOf('theme: \'kkt\'')) + 9;
  
  const wechatButton = `
          <button 
            onClick={() => onUpdateSettings({...settings, theme: 'wechat'})}
            className={\`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 \${settings.theme === 'wechat' ? 'border-[#95EC69] bg-[#EDEDED]' : 'border-stone-100 bg-white hover:bg-stone-50'}\`}
          >
            <div className="w-12 h-12 rounded-[16px] bg-[#95EC69] flex items-center justify-center text-[#3E2723] font-bold">
              WeChat
            </div>
            <span className="font-bold text-sm">WeChat</span>
          </button>`;
          
  text = text.slice(0, kktButtonEnd) + wechatButton + text.slice(kktButtonEnd);
}

// Add the pb-32 to max-w-2xl mx-auto px-4 py-8 to ensure scrolling
text = text.replace(/max-w-2xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300/g, "max-w-2xl mx-auto px-4 py-8 pb-32 space-y-8 animate-in fade-in duration-300 h-full overflow-y-auto");

fs.writeFileSync('src/components/SettingsView.tsx', text, 'utf-8');
