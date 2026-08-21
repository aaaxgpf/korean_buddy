const fs = require('fs');
let text = fs.readFileSync('src/components/CustomPersonaModal.tsx', 'utf-8');

text = text.replace(/bg-amber-500/g, 'bg-stone-900');
text = text.replace(/hover:bg-amber-600/g, 'hover:bg-black');
text = text.replace(/bg-amber-400/g, 'bg-stone-900');
text = text.replace(/border-amber-400/g, 'border-stone-900');
text = text.replace(/ring-amber-400\/30/g, 'ring-stone-900/10');
text = text.replace(/focus:border-amber-400/g, 'focus:border-stone-400');
text = text.replace(/focus:ring-amber-400\/20/g, 'focus:ring-stone-400/10');

fs.writeFileSync('src/components/CustomPersonaModal.tsx', text, 'utf-8');
