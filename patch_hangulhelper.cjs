const fs = require('fs');
let text = fs.readFileSync('src/components/HangulHelper.tsx', 'utf-8');

text = text.replace(/Windows: Win \+ Space 切换韩文键盘; Mac: Ctrl \+ Space/g, "Windows: Win + Space to switch keyboard; Mac: Ctrl + Space");
text = text.replace(/韩文字母辅助键盘 & 键位速查 \(Hangul Typing Guide\)/g, "Hangul Typing Guide");
text = text.replace(/💡 快捷键切换韩文键盘：Windows/g, "💡 Keyboard shortcut to switch: Windows");
text = text.replace(/已复制/g, "Copied");
text = text.replace(/复制/g, "Copy");
text = text.replace(/基本辅音 \(Consonants\) & 对应键位:/g, "Basic Consonants:");
text = text.replace(/发音: (.*?) \| 按键: (.*?)/g, "Pronunciation: $1 | Key: $2");
text = text.replace(/双辅音\/紧音 \(Double Consonants\):/g, "Double Consonants:");
text = text.replace(/基本元音 \(Vowels\):/g, "Basic Vowels:");
text = text.replace(/复合元音 \(Complex Vowels\):/g, "Complex Vowels:");

fs.writeFileSync('src/components/HangulHelper.tsx', text, 'utf-8');
