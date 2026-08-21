const fs = require('fs');

function patchFile(filename) {
  if (!fs.existsSync(filename)) return;
  let code = fs.readFileSync(filename, 'utf-8');
  // Remove description paragraphs (text-stone-500)
  code = code.replace(/<p className="text-sm sm:text-base text-stone-500 max-w-2xl mt-1">[\s\S]*?<\/p>/g, '');
  code = code.replace(/<p className="text-sm text-stone-500 max-w-2xl mt-1">[\s\S]*?<\/p>/g, '');
  code = code.replace(/<p className="text-stone-500 text-sm mt-1">[\s\S]*?<\/p>/g, '');
  
  // Convert basic headings to simpler text if possible, e.g. "단어장 (Flashcards)" -> "Flashcards"
  code = code.replace(/단어장 \(Flashcards\)/g, 'Flashcards');
  code = code.replace(/핵심 문법 \(Grammar\)/g, 'Grammar');
  code = code.replace(/듣고 쓰기 \(Dictation\)/g, 'Dictation');
  code = code.replace(/매일 회화 \(Speaking\)/g, 'Speaking');
  code = code.replace(/내 단어장 \(Notebook\)/g, 'Notebook');
  
  fs.writeFileSync(filename, code, 'utf-8');
}

patchFile('src/components/FlashcardsView.tsx');
patchFile('src/components/GrammarView.tsx');
patchFile('src/components/DictationView.tsx');
patchFile('src/components/SpeakingView.tsx');
patchFile('src/components/NotebookView.tsx');
