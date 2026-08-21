const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

const lastDiv = text.lastIndexOf('</div>');
text = text.substring(0, lastDiv + 6) + '\n    </div>\n  );\n};\n';

fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
