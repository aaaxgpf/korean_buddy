const fs = require('fs');
let study = fs.readFileSync('src/components/StudyView.tsx', 'utf-8');

study = study.replace(
  /const menus = \[[\s\S]*?\] as const;/m,
  `const menus = [
    { id: 'flashcards', label: 'Flashcards', desc: 'Study vocabulary and phrases', icon: Layers, color: 'text-stone-700', bg: 'bg-stone-100' },
    { id: 'grammar', label: 'Grammar', desc: 'Learn sentence structures', icon: BookOpen, color: 'text-stone-700', bg: 'bg-stone-100' },
    { id: 'dictation', label: 'Dictation', desc: 'Listening & writing practice', icon: Headphones, color: 'text-stone-700', bg: 'bg-stone-100' },
    { id: 'speaking', label: 'Speaking', desc: 'Pronunciation and dialogue', icon: Mic, color: 'text-stone-700', bg: 'bg-stone-100' },
    { id: 'notebook', label: 'Notebook', desc: 'Your saved items', icon: Layers, color: 'text-stone-700', bg: 'bg-stone-100' },
  ] as const;`
);

// also remove long descriptions if they exist, but actually these are just the menu items.
fs.writeFileSync('src/components/StudyView.tsx', study, 'utf-8');
