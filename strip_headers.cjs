const fs = require('fs');
const files = [
  'src/components/FlashcardsView.tsx',
  'src/components/GrammarView.tsx',
  'src/components/DictationView.tsx',
  'src/components/SpeakingView.tsx',
  'src/components/NotebookView.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf-8');
  
  // Try to remove standard Header Bar structure we generated initially
  code = code.replace(/\{\/\* Header Bar \*\/\}\s*<div className="flex flex-col[\s\S]*?<\/h2>\s*(<p[\s\S]*?<\/p>)?\s*<\/div>\s*<div[\s\S]*?<\/div>\s*<\/div>/g, '');
  code = code.replace(/\{\/\* Header Bar \*\/\}\s*<div className="flex flex-col[\s\S]*?<\/h2>\s*(<p[\s\S]*?<\/p>)?\s*<\/div>\s*<\/div>/g, '');
  
  // For NotebookView:
  code = code.replace(/\{\/\* Header \*\/\}\s*<div className="flex flex-col[\s\S]*?<\/h2>\s*(<p[\s\S]*?<\/p>)?\s*<\/div>\s*<\/div>/g, '');
  code = code.replace(/\{\/\* Header \*\/\}\s*<div className="flex flex-col[\s\S]*?<\/h2>\s*(<p[\s\S]*?<\/p>)?\s*<\/div>\s*<div[\s\S]*?<\/div>\s*<\/div>/g, '');

  fs.writeFileSync(file, code, 'utf-8');
});

console.log("Stripped headers");
