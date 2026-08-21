const fs = require('fs');
const views = [
  'src/components/FlashcardsView.tsx',
  'src/components/GrammarView.tsx',
  'src/components/DictationView.tsx',
  'src/components/SpeakingView.tsx',
  'src/components/NotebookView.tsx'
];

views.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  
  // Replace standard padding with pb-32 for mobile
  content = content.replace(/className="(max-w-[a-zA-Z0-9]+ mx-auto px-4 py-8.*?)"/, 'className="$1 pb-32"');
  content = content.replace(/className="(max-w-[a-zA-Z0-9]+ mx-auto p-4 md:p-8.*?)"/, 'className="$1 pb-32"');
  
  fs.writeFileSync(file, content, 'utf-8');
});
