const fs = require('fs');
let view = fs.readFileSync('src/components/StudyView.tsx', 'utf-8');

view = view.replace(
  /<div className="flex flex-col h-full w-full bg-transparent overflow-y-auto p-4 md:p-8">/,
  '<div className="h-full w-full overflow-y-auto bg-transparent p-4 md:p-8 pb-32">'
);

fs.writeFileSync('src/components/StudyView.tsx', view, 'utf-8');
