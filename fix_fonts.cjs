const fs = require('fs');
let text = fs.readFileSync('src/index.css', 'utf-8');

text = text.replace(
  /@theme \{[^}]+\}/g,
  ''
);

text = text.replace(
  /font-family: -apple-system, system-ui, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif;/g,
  ''
);

fs.writeFileSync('src/index.css', text, 'utf-8');
