const fs = require('fs');
let text = fs.readFileSync('src/index.css', 'utf-8');

text = text.replace(
  "font-family: 'Plus Jakarta Sans', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;",
  'font-family: -apple-system, system-ui, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif;'
);

text = text.replace(
  "font-family: 'Cormorant Garamond', 'Noto Serif KR', serif;",
  'font-family: -apple-system, system-ui, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif;'
);

fs.writeFileSync('src/index.css', text, 'utf-8');
