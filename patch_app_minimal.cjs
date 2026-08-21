const fs = require('fs');
let text = fs.readFileSync('src/App.tsx', 'utf-8');

text = text.replace(
  'border-r border-stone-200',
  'border-r border-stone-100/50'
);

text = text.replace(
  '<h2 className="text-2xl font-bold text-[#3E2723]">친구 (Friends)</h2>',
  '<h2 className="text-3xl font-light tracking-tight text-stone-800">Friends</h2>'
);

text = text.replace(
  '<div className="text-xs font-semibold text-stone-500 mb-3 ml-2 border-b border-stone-200 pb-1">내 프로필</div>',
  '<div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-3 ml-2">My Profile</div>'
);

text = text.replace(
  '<div className="w-14 h-14 rounded-[20px] bg-[#3E2723] text-[#FFEB3B] flex items-center justify-center font-bold text-xl shadow-sm overflow-hidden shrink-0">',
  '<div className="w-14 h-14 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center font-bold text-xl overflow-hidden shrink-0">'
);

text = text.replace(
  '<div className="text-xs font-semibold text-stone-500 mt-6 mb-3 ml-2 border-b border-stone-200 pb-1">친구 {companions.length}</div>',
  '<div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mt-8 mb-3 ml-2">Buddies</div>'
);

text = text.replace(
  '<div className="w-12 h-12 rounded-[18px] bg-stone-100 border border-stone-200 flex items-center justify-center text-2xl shadow-sm overflow-hidden shrink-0">',
  '<div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center text-2xl overflow-hidden shrink-0">'
);

text = text.replace(
  'border-b border-stone-100 pb-2 group-last:border-0',
  'pb-2'
);

fs.writeFileSync('src/App.tsx', text, 'utf-8');
