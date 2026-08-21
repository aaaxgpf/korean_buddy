const fs = require('fs');
let text = fs.readFileSync('src/App.tsx', 'utf-8');

text = text.replace(
  'onSaveDialogue={handleSaveDialogue}',
  'onSaveDialogue={handleSaveDialogue}\n                 onOpenProfile={() => setIsCompanionProfileOpen(true)}'
);

fs.writeFileSync('src/App.tsx', text, 'utf-8');
