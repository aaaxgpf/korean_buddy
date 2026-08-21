import React, { useState } from 'react';
import { Keyboard, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface HangulHelperProps {
  onInsertChar?: (char: string) => void;
}

export const HangulHelper: React.FC<HangulHelperProps> = ({ onInsertChar }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const consonants = [
    { char: 'ㄱ', rom: 'g/k', key: 'r' },
    { char: 'ㄴ', rom: 'n', key: 's' },
    { char: 'ㄷ', rom: 'd/t', key: 'e' },
    { char: 'ㄹ', rom: 'r/l', key: 'f' },
    { char: 'ㅁ', rom: 'm', key: 'a' },
    { char: 'ㅂ', rom: 'b/p', key: 'q' },
    { char: 'ㅅ', rom: 's', key: 't' },
    { char: 'ㅇ', rom: 'ng/silent', key: 'd' },
    { char: 'ㅈ', rom: 'j/ch', key: 'w' },
    { char: 'ㅊ', rom: 'ch', key: 'c' },
    { char: 'ㅋ', rom: 'k', key: 'z' },
    { char: 'ㅌ', rom: 't', key: 'x' },
    { char: 'ㅍ', rom: 'p', key: 'v' },
    { char: 'ㅎ', rom: 'h', key: 'g' },
  ];

  const doubleConsonants = [
    { char: 'ㄲ', rom: 'kk', key: 'Shift+R' },
    { char: 'ㄸ', rom: 'tt', key: 'Shift+E' },
    { char: 'ㅃ', rom: 'pp', key: 'Shift+Q' },
    { char: 'ㅆ', rom: 'ss', key: 'Shift+T' },
    { char: 'ㅉ', rom: 'jj', key: 'Shift+W' },
  ];

  const vowels = [
    { char: 'ㅏ', rom: 'a', key: 'k' },
    { char: 'ㅑ', rom: 'ya', key: 'i' },
    { char: 'ㅓ', rom: 'eo', key: 'j' },
    { char: 'ㅕ', rom: 'yeo', key: 'u' },
    { char: 'ㅗ', rom: 'o', key: 'h' },
    { char: 'ㅛ', rom: 'yo', key: 'y' },
    { char: 'ㅜ', rom: 'u', key: 'n' },
    { char: 'ㅠ', rom: 'yu', key: 'b' },
    { char: 'ㅡ', rom: 'eu', key: 'm' },
    { char: 'ㅣ', rom: 'i', key: 'l' },
  ];

  const complexVowels = [
    { char: 'ㅐ', rom: 'ae', key: 'o' },
    { char: 'ㅒ', rom: 'yae', key: 'Shift+O' },
    { char: 'ㅔ', rom: 'e', key: 'p' },
    { char: 'ㅖ', rom: 'ye', key: 'Shift+P' },
    { char: 'ㅘ', rom: 'wa', key: 'h+k' },
    { char: 'ㅙ', rom: 'wae', key: 'h+o' },
    { char: 'ㅚ', rom: 'oe', key: 'h+l' },
    { char: 'ㅝ', rom: 'wo', key: 'n+j' },
    { char: 'ㅞ', rom: 'we', key: 'n+p' },
    { char: 'ㅟ', rom: 'wi', key: 'n+l' },
    { char: 'ㅢ', rom: 'ui', key: 'm+l' },
  ];

  const handleCopyTip = () => {
    navigator.clipboard.writeText('Windows: Win + Space to switch keyboard; Mac: Ctrl + Space');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-[#E0DED7] rounded-2xl overflow-hidden text-xs shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-[#FAF9F6] hover:bg-[#F5F2ED] text-[#2D2D2D] font-medium transition-colors"
      >
        <span className="flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-[#8B7E74]" />
          <span className="font-sans font-medium">Hangul Typing Guide</span>
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-[#8B7E74]" /> : <ChevronDown className="w-4 h-4 text-[#8B7E74]" />}
      </button>

      {isOpen && (
        <div className="p-4 bg-white space-y-3.5 border-t border-[#E0DED7]">
          
          {/* Tip */}
          <div className="flex items-center justify-between bg-[#F5F2ED] p-2.5 rounded-xl text-[11px] text-[#71675E] border border-[#E0DED7]">
            <span>💡 Keyboard shortcut to switch: Windows <code className="bg-white px-1.5 py-0.5 rounded border border-[#E0DED7] font-mono text-[#1A1A1A]">Win + Space</code> / Mac <code className="bg-white px-1.5 py-0.5 rounded border border-[#E0DED7] font-mono text-[#1A1A1A]">Ctrl + Space</code></span>
            <button
              onClick={handleCopyTip}
              className="flex items-center gap-1 text-[#2D2D2D] hover:text-[#8B7E74] font-medium ml-2 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Consonants */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#B5A69A] block mb-1.5">
              Basic Consonants:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {consonants.map((item) => (
                <button
                  key={item.char}
                  type="button"
                  onClick={() => onInsertChar?.(item.char)}
                  className="flex flex-col items-center px-2.5 py-1 rounded-lg bg-[#FAF9F6] hover:bg-[#2D2D2D] hover:text-white border border-[#E0DED7] transition-all group"
                  title={`Pronunciation: ${item.rom} | Key: ${item.key}`}
                >
                  <span className="font-bold text-sm font-sans-kr text-[#1A1A1A] group-hover:text-white">{item.char}</span>
                  <span className="text-[9px] text-[#8B7E74] group-hover:text-[#E0DED7] font-mono">{item.key}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Double Consonants */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#B5A69A] block mb-1.5">
              Double Consonants:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {doubleConsonants.map((item) => (
                <button
                  key={item.char}
                  type="button"
                  onClick={() => onInsertChar?.(item.char)}
                  className="flex flex-col items-center px-2.5 py-1 rounded-lg bg-[#FAF9F6] hover:bg-[#2D2D2D] hover:text-white border border-[#E0DED7] transition-all group"
                  title={`Pronunciation: ${item.rom} | Key: ${item.key}`}
                >
                  <span className="font-bold text-sm font-sans-kr text-[#1A1A1A] group-hover:text-white">{item.char}</span>
                  <span className="text-[9px] text-[#8B7E74] group-hover:text-[#E0DED7] font-mono">{item.key}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Vowels */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#B5A69A] block mb-1.5">
              Basic Vowels:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {vowels.map((item) => (
                <button
                  key={item.char}
                  type="button"
                  onClick={() => onInsertChar?.(item.char)}
                  className="flex flex-col items-center px-2.5 py-1 rounded-lg bg-[#FAF9F6] hover:bg-[#2D2D2D] hover:text-white border border-[#E0DED7] transition-all group"
                  title={`Pronunciation: ${item.rom} | Key: ${item.key}`}
                >
                  <span className="font-bold text-sm font-sans-kr text-[#1A1A1A] group-hover:text-white">{item.char}</span>
                  <span className="text-[9px] text-[#8B7E74] group-hover:text-[#E0DED7] font-mono">{item.key}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Complex Vowels */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#B5A69A] block mb-1.5">
              Complex Vowels:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {complexVowels.map((item) => (
                <button
                  key={item.char}
                  type="button"
                  onClick={() => onInsertChar?.(item.char)}
                  className="flex flex-col items-center px-2 py-1 rounded-lg bg-[#FAF9F6] hover:bg-[#2D2D2D] hover:text-white border border-[#E0DED7] transition-all group"
                  title={`Pronunciation: ${item.rom} | Key: ${item.key}`}
                >
                  <span className="font-bold text-sm font-sans-kr text-[#1A1A1A] group-hover:text-white">{item.char}</span>
                  <span className="text-[9px] text-[#8B7E74] group-hover:text-[#E0DED7] font-mono">{item.key}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
