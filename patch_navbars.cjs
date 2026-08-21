const fs = require('fs');
let text = fs.readFileSync('src/components/Navbar.tsx', 'utf-8');

text = text.replace(
  "bg-[#FAF9F6]/95 border-stone-200",
  "bg-transparent border-transparent"
);

fs.writeFileSync('src/components/Navbar.tsx', text, 'utf-8');
