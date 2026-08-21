const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
code = code.replace(/onSaveVocab=\{handleSaveVocab\}\n\s+\/>/g,
  `onSaveVocab={handleSaveVocab}\n                 savedVocabIds={savedVocabIds}\n                 onSaveDialogue={handleSaveDialogue}\n                 savedDialogueIds={savedDialogueIds}\n               />`);
fs.writeFileSync('src/App.tsx', code, 'utf-8');
