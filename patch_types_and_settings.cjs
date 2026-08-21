const fs = require('fs');

// 1. types.ts
let types = fs.readFileSync('src/types.ts', 'utf-8');
types = types.replace(
  /theme\?: 'default' \| 'kkt';/,
  "theme?: 'default' | 'kkt' | 'wechat';"
);
fs.writeFileSync('src/types.ts', types, 'utf-8');

// 2. SettingsView.tsx
let settings = fs.readFileSync('src/components/SettingsView.tsx', 'utf-8');

// Make it scrollable
settings = settings.replace(
  /<div className="flex-1 bg-transparent p-4 md:p-8">/,
  '<div className="h-full w-full overflow-y-auto bg-transparent p-4 md:p-8 pb-32">' // Added pb-32 to clear bottom nav
);

// Add WeChat theme option
const themeOptionsRegex = /<select[\s\S]*?<\/select>/;
const newThemeOptions = `<select
            value={settings.theme}
            onChange={(e) => onUpdateSettings({ ...settings, theme: e.target.value as any })}
            className="p-2 rounded-xl border border-stone-200 bg-stone-50 outline-none"
          >
            <option value="default">Default (Light)</option>
            <option value="kkt">KakaoTalk</option>
            <option value="wechat">WeChat</option>
          </select>`;
settings = settings.replace(themeOptionsRegex, newThemeOptions);

// Replace any leftover Chinese in Settings
settings = settings.replace(/主题/g, "Theme");
settings = settings.replace(/目标/g, "Goal");
settings = settings.replace(/词/g, "words");
settings = settings.replace(/语言/g, "Language");
settings = settings.replace(/中文/g, "Chinese");
settings = settings.replace(/英文/g, "English");

fs.writeFileSync('src/components/SettingsView.tsx', settings, 'utf-8');

