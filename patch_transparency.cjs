const fs = require('fs');
const files = [
  'src/App.tsx',
  'src/components/StudyView.tsx',
  'src/components/FlashcardsView.tsx',
  'src/components/GrammarView.tsx',
  'src/components/DictationView.tsx',
  'src/components/SpeakingView.tsx',
  'src/components/NotebookView.tsx',
  'src/components/SettingsView.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf-8');
  
  // App.tsx specific replacements
  if (file === 'src/App.tsx') {
    code = code.replace(
      /<div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-white">/g,
      '<div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-transparent">'
    );
    code = code.replace(
      /bg-white overflow-y-auto \$\{chatView/g,
      'bg-transparent overflow-y-auto ${chatView'
    );
    // Replace the settings view wrapper
    code = code.replace(
      /className="flex-1 bg-\[#FAF9F6\]/g,
      'className="flex-1 bg-transparent'
    );
  } else if (file === 'src/components/StudyView.tsx') {
    code = code.replace(/bg-\[#FAF9F6\]/g, 'bg-transparent');
    code = code.replace(/bg-white border-b/g, 'bg-white/80 backdrop-blur border-b'); // header
  } else if (file === 'src/components/SettingsView.tsx') {
    code = code.replace(/bg-\[#FAF9F6\]/g, 'bg-transparent');
  } else {
    // For the individual study views, let them keep bg-[#FAF9F6] for cards, or change to white/transparent
    // The user mainly complained about theme not applying globally
    // We can replace the root level background if there is one
  }

  fs.writeFileSync(file, code, 'utf-8');
});
