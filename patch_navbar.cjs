const fs = require('fs');
let text = fs.readFileSync('src/components/Navbar.tsx', 'utf-8');

text = text.replace(
  "bg-[#FAF9F6]/95 border-stone-200",
  "bg-transparent border-transparent"
);

text = text.replace(
  "w-11 h-11 rounded-2xl bg-[#3E2723] text-[#FFEB3B] flex items-center justify-center font-serif text-xl font-bold shadow-sm",
  "w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center font-serif text-xl font-bold shadow-sm"
);

text = text.replace(
  '<span className="font-serif text-2xl font-bold tracking-tight text-[#3E2723] leading-none">',
  '<span className="font-sans tracking-tighter text-2xl font-black text-stone-900 leading-none">'
);

text = text.replace(
  '<span className="font-normal italic">Buddy</span>',
  '<span className="font-light italic text-stone-400">Buddy</span>'
);

text = text.replace(
  "bg-[#3E2723] text-white shadow-sm",
  "bg-stone-900 text-white shadow-md"
);

fs.writeFileSync('src/components/Navbar.tsx', text, 'utf-8');
