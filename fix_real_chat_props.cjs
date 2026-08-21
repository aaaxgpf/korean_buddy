const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

// Add to CompanionChatProps interface
text = text.replace(
  '  savedDialogueIds: Set<string>;',
  '  savedDialogueIds: Set<string>;\n  onOpenProfile?: () => void;'
);

// Add to destructured arguments
text = text.replace(
  '  onSaveDialogue,',
  '  onSaveDialogue,\n  onOpenProfile,'
);

fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
