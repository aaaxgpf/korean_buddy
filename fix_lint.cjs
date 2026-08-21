const fs = require('fs');

// Fix App.tsx
let appText = fs.readFileSync('src/App.tsx', 'utf-8');
appText = appText.replace(/companion={activeCompanion}/g, 'companion={currentCompanion}');
appText = appText.replace(/if \(activeCompanion\?\.id === updatedComp\.id\)/g, 'if (currentCompanion?.id === updatedComp.id)');
fs.writeFileSync('src/App.tsx', appText, 'utf-8');

// Fix CompanionChat.tsx
let chatText = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');
chatText = chatText.replace(/onStartVoiceCall\?: \(\) => void;/g, 'onStartVoiceCall?: () => void;\n  onOpenProfile?: () => void;');
fs.writeFileSync('src/components/CompanionChat.tsx', chatText, 'utf-8');

