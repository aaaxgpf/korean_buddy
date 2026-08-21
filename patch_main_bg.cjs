const fs = require('fs');
let text = fs.readFileSync('src/App.tsx', 'utf-8');

text = text.replace(
  '${settings.theme === "kkt" ? "bg-[#b2c7d9]" : "bg-[#FAF9F6]"}',
  '${settings.theme === "kkt" ? "bg-[#b2c7d9]" : settings.theme === "wechat" ? "bg-[#EDEDED]" : "bg-[#FAF9F6]"}'
);

fs.writeFileSync('src/App.tsx', text, 'utf-8');
