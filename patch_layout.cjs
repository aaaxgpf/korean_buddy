const fs = require('fs');

// 1. App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf-8');

// Always render Navbar
app = app.replace(
  /\{!\s*\(\s*activeTab === 'chat' && chatView === 'chat'\s*\)\s*&&\s*<Navbar/g,
  '<Navbar hideMobileNav={activeTab === "chat" && chatView === "chat"}'
);

// Main padding
app = app.replace(
  /<main className="flex-1 relative min-h-0 overflow-hidden flex flex-col pb-16 md:pb-0">/g,
  '<main className={`flex-1 relative min-h-0 overflow-hidden flex flex-col ${activeTab === "chat" && chatView === "chat" ? "pb-0" : "pb-16"} md:pb-0`}>'
);

// Theme globals (for background)
app = app.replace(
  /<div className="h-\[100dvh\] overflow-hidden bg-\[#FAF9F6\] text-\[#2D2D2D\] flex flex-col font-sans selection:bg-\[#8B7E74\]\/20 selection:text-\[#1A1A1A\]">/g,
  '<div className={`h-[100dvh] overflow-hidden text-[#2D2D2D] flex flex-col font-sans selection:bg-[#8B7E74]/20 selection:text-[#1A1A1A] ${settings.theme === "kkt" ? "bg-[#b2c7d9]" : "bg-[#FAF9F6]"}`}>'
);

fs.writeFileSync('src/App.tsx', app, 'utf-8');

// 2. Navbar.tsx
let nav = fs.readFileSync('src/components/Navbar.tsx', 'utf-8');
nav = nav.replace(/interface Props \{/g, 'interface Props {\n  hideMobileNav?: boolean;');
nav = nav.replace(/\{ activeTab, setActiveTab \}/g, '{ activeTab, setActiveTab, hideMobileNav }');

// Hide mobile nav
nav = nav.replace(
  /<nav className="md:hidden fixed bottom-0/g,
  '{!hideMobileNav && <nav className="md:hidden fixed bottom-0'
);
nav = nav.replace(
  /<\/nav>\s*<\/>/g,
  '</nav>}\n    </>'
);

fs.writeFileSync('src/components/Navbar.tsx', nav, 'utf-8');
