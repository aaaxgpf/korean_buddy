const fs = require('fs');
let text = fs.readFileSync('src/components/SettingsView.tsx', 'utf-8');

text = text.replace(/text-amber-500/g, 'text-stone-800');
text = text.replace(/text-\[\#3E2723\]/g, 'text-stone-800');
text = text.replace(/bg-\[\#3E2723\]/g, 'bg-stone-100 text-stone-800');
text = text.replace(/text-rose-500/g, 'text-stone-800');
text = text.replace(/accent-rose-500/g, 'accent-stone-800');
text = text.replace(/text-blue-500/g, 'text-stone-800');
text = text.replace(/border-stone-100 bg-white/g, 'border-transparent bg-stone-50');

fs.writeFileSync('src/components/SettingsView.tsx', text, 'utf-8');
