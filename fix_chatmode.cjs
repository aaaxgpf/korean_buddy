const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');
text = text.replace(
  "const [chatMode, setChatMode] = useState<'immersive' | 'study'>('immersive');\n",
  ""
);
fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
