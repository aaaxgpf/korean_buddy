const fs = require('fs');

// Patch CompanionChat.tsx
let cc = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');
if (!cc.includes('onBack?: () => void;')) {
  cc = cc.replace(/interface CompanionChatProps \{/, `interface CompanionChatProps {\n  onBack?: () => void;`);
  cc = cc.replace(/export const CompanionChat: React\.FC<CompanionChatProps> = \(\{/, `export const CompanionChat: React.FC<CompanionChatProps> = ({\n  onBack,`);
  // Add back button in header
  cc = cc.replace(/<div className="flex items-center gap-3">/, `$&
            {onBack && (
              <button onClick={onBack} className="md:hidden p-1 -ml-2 text-[#3E2723] hover:bg-black/5 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
            )}`);
  fs.writeFileSync('src/components/CompanionChat.tsx', cc, 'utf-8');
}

// Patch App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf-8');
// remove the absolute back button from App.tsx
app = app.replace(/<button onClick=\{\(\) => setChatView\('list'\)\} className="md:hidden absolute top-4 left-4 z-50 p-2 bg-white\/50 backdrop-blur-md rounded-full shadow-sm text-stone-700 hover:bg-white border border-stone-200">[\s\S]*?<\/button>/, '');
// Add onBack prop to CompanionChat
app = app.replace(/<CompanionChat/, `<CompanionChat onBack={() => setChatView('list')}`);
fs.writeFileSync('src/App.tsx', app, 'utf-8');

