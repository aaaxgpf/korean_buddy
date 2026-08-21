const fs = require('fs');
let text = fs.readFileSync('src/components/StudyView.tsx', 'utf-8');

text = text.replace(
  'className="w-full flex items-center p-4 bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all text-left group"',
  'className="w-full flex items-center p-5 bg-transparent hover:bg-white/60 rounded-3xl transition-all text-left group"'
);

text = text.replace(
  /className=\{`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 \$\{menu\.bg\} \$\{menu\.color\} mr-4`\}/g,
  'className={`w-12 h-12 flex items-center justify-center shrink-0 ${menu.color} mr-4`}'
);

text = text.replace(
  'className="w-8 h-8 rounded-full flex items-center justify-center bg-stone-50 group-hover:bg-stone-100 transition-colors"',
  'className="w-8 h-8 flex items-center justify-center transition-colors opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 duration-300 ease-out"'
);

text = text.replace(
  '<h1 className="text-2xl font-bold text-stone-800 px-2 mt-4">Study Modules</h1>',
  '<h1 className="text-3xl font-light tracking-tight text-stone-800 px-2 mt-8 mb-8">Study</h1>'
);

text = text.replace(
  '<div className="flex items-center px-4 py-3 bg-white/80 backdrop-blur border-b border-stone-200 shrink-0 sticky top-0 z-20">',
  '<div className="flex items-center px-4 py-4 bg-white/40 backdrop-blur-md shrink-0 sticky top-0 z-20">'
);

fs.writeFileSync('src/components/StudyView.tsx', text, 'utf-8');
