const fs = require('fs');
let text = fs.readFileSync('src/index.css', 'utf-8');

text = text.replace(
  '@import "tailwindcss";',
  `@import "tailwindcss";

@theme {
  --font-sans: -apple-system, system-ui, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif;
  --font-serif: -apple-system, system-ui, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif;
}`
);

fs.writeFileSync('src/index.css', text, 'utf-8');
