const fs = require('fs');
let text = fs.readFileSync('src/App.tsx', 'utf-8');

text = text.replace(
  /\$\{settings.theme === "kkt" \? "bg-\\[#b2c7d9\\]" : "bg-\\[#FAF9F6\\]"\}/,
  '${settings.theme === "kkt" ? "bg-[#b2c7d9]" : settings.theme === "wechat" ? "bg-[#EDEDED]" : "bg-[#FAF9F6]"}'
);

text = text.replace(
  /font-serif/g,
  'font-sans'
);

text = text.replace(
  /font-light/g,
  'font-medium'
);

text = text.replace(
  /font-black/g,
  'font-bold'
);

fs.writeFileSync('src/App.tsx', text, 'utf-8');
