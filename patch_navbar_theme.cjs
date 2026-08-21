const fs = require('fs');
// 1. App.tsx - pass theme to Navbar
let app = fs.readFileSync('src/App.tsx', 'utf-8');
app = app.replace(
  /<Navbar hideMobileNav/g,
  '<Navbar theme={settings.theme} hideMobileNav'
);
fs.writeFileSync('src/App.tsx', app, 'utf-8');

// 2. Navbar.tsx - accept theme
let nav = fs.readFileSync('src/components/Navbar.tsx', 'utf-8');
nav = nav.replace(/interface Props \{/g, 'interface Props {\n  theme?: string;');
nav = nav.replace(/\{ activeTab, setActiveTab, hideMobileNav \}/g, '{ activeTab, setActiveTab, hideMobileNav, theme }');

// header background
nav = nav.replace(
  /bg-\[#FAF9F6\]\/95/g,
  '${theme === "kkt" ? "bg-[#b2c7d9]/95" : "bg-[#FAF9F6]/95"}'
);
nav = nav.replace(
  /<header className="hidden md:block sticky top-0 z-30/g,
  '<header className={`hidden md:block sticky top-0 z-30 ${theme === "kkt" ? "bg-[#b2c7d9]/95 border-[#9bbbd4]" : "bg-[#FAF9F6]/95 border-stone-200"} backdrop-blur-md border-b text-[#2D2D2D] transition-colors`}'
);
// remove the old one since we just fully replaced it
nav = nav.replace(
  /\$\{theme === "kkt" \? "bg-\[#b2c7d9\]\/95" : "bg-\[#FAF9F6\]\/95"\} backdrop-blur-md border-b border-stone-200 text-\[#2D2D2D\] transition-colors">/g,
  '>'
);

// mobile nav background
nav = nav.replace(
  /<nav className="md:hidden fixed bottom-0 w-full \$\{theme === "kkt" \? "bg-\[#b2c7d9\]\/95" : "bg-\[#FAF9F6\]\/95"\} backdrop-blur-md border-t border-stone-200/g,
  '<nav className={`md:hidden fixed bottom-0 w-full ${theme === "kkt" ? "bg-[#b2c7d9]/95 border-[#9bbbd4]" : "bg-[#FAF9F6]/95 border-stone-200"} backdrop-blur-md border-t'
);

fs.writeFileSync('src/components/Navbar.tsx', nav, 'utf-8');
