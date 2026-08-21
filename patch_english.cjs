const fs = require('fs');

let nav = fs.readFileSync('src/components/Navbar.tsx', 'utf-8');
nav = nav.replace(/label: '채팅'/g, "label: 'Chat'");
nav = nav.replace(/label: '학습'/g, "label: 'Study'");
nav = nav.replace(/label: '설정'/g, "label: 'Settings'");
fs.writeFileSync('src/components/Navbar.tsx', nav, 'utf-8');

let settings = fs.readFileSync('src/components/SettingsView.tsx', 'utf-8');
settings = settings.replace(/"설정 \(Settings\)"/g, '"Settings"');
settings = settings.replace(/"앱 테마"/g, '"App Theme"');
settings = settings.replace(/"기본 원목"/g, '"Wood/Light"');
settings = settings.replace(/"카카오톡"/g, '"KakaoTalk"');
settings = settings.replace(/"학습 목표"/g, '"Study Goals"');
settings = settings.replace(/"일일 단어 목표"/g, '"Daily Vocab Goal"');
settings = settings.replace(/"단어"/g, '"words"');
settings = settings.replace(/"언어 모드"/g, '"Translation Language"');
settings = settings.replace(/"이중 언어 \(Bilingual\)"/g, '"Bilingual"');
settings = settings.replace(/"중국어 \(Chinese\)"/g, '"Chinese"');
settings = settings.replace(/"영어 \(English\)"/g, '"English"');
fs.writeFileSync('src/components/SettingsView.tsx', settings, 'utf-8');

