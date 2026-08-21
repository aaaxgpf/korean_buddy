const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

text = text.replace(
    '      </div>  \n      \n  );\n};',
    '      </div>\n    </div>\n  );\n};'
);

text = text.replace(
    '      </div>\n        );\n};',
    '      </div>\n    </div>\n  );\n};'
);


fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
