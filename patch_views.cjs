const fs = require('fs');

const files = [
  'src/components/SpeakingView.tsx',
  'src/components/FlashcardsView.tsx',
  'src/components/GrammarView.tsx',
  'src/components/DictationView.tsx',
  'src/components/NotebookView.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  // Remove the <p> elements that follow the h1 titles inside the headers
  content = content.replace(/<p className="text-sm sm:text-base text-stone-500 max-w-2xl mt-1">[\s\S]*?<\/p>/, '');
  content = content.replace(/<p className="text-sm text-stone-500 max-w-2xl mt-1">[\s\S]*?<\/p>/, '');
  fs.writeFileSync(file, content, 'utf-8');
});

