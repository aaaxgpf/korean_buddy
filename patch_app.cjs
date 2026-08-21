const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

// Fix global app background for WeChat
app = app.replace(
  /const getBgClass = \(\) => {[\s\S]*?};/,
  `const getBgClass = () => {
    if (settings.theme === 'kkt') return 'bg-[#b2c7d9]';
    if (settings.theme === 'wechat') return 'bg-[#EDEDED]';
    return 'bg-[#FAF9F6]';
  };`
);

// Fix Friends list scrolling on mobile by making sure it has h-full and pb-32 to clear the nav if on mobile
app = app.replace(
  /shrink-0 w-full md:w-80 lg:w-96 flex-col border-r border-stone-200 bg-transparent overflow-y-auto \$\{chatView === 'chat' \? 'hidden md:flex' : 'flex'\}/,
  "h-full shrink-0 w-full md:w-80 lg:w-96 flex-col border-r border-stone-200 bg-transparent overflow-y-auto pb-32 md:pb-0 ${chatView === 'chat' ? 'hidden md:flex' : 'flex'}"
);

// Remove Chinese from App.tsx
app = app.replace(/搜索伙伴\.\.\./g, 'Search companions...');
app = app.replace(/最近练习/g, 'Recent');
app = app.replace(/全部伙伴/g, 'All Companions');
app = app.replace(/天记录/g, ' day streak');

fs.writeFileSync('src/App.tsx', app, 'utf-8');
