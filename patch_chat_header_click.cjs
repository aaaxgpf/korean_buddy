const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

text = text.replace(
  '<div className="flex flex-col">',
  '<div className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity" onClick={onOpenProfile}>'
);

fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
