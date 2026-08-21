const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf-8');

app = app.replace(
  /<div className="min-h-screen bg-\[#FAF9F6\] text-\[#2D2D2D\] flex flex-col font-sans selection:bg-\[#8B7E74\]\/20 selection:text-\[#1A1A1A\]">/,
  '<div className="h-[100dvh] overflow-hidden bg-[#FAF9F6] text-[#2D2D2D] flex flex-col font-sans selection:bg-[#8B7E74]/20 selection:text-[#1A1A1A]">'
);

app = app.replace(
  /<main className="flex-1 pb-16 lg:pb-8 lg:pt-0">/,
  '<main className="flex-1 relative min-h-0 overflow-hidden flex flex-col pb-16 md:pb-0">'
);

fs.writeFileSync('src/App.tsx', app, 'utf-8');
