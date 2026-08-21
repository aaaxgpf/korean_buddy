import * as pdfjsLib from 'pdfjs-dist';
import { VocabItem } from '../types';

// Set up PDF.js worker using public unpkg CDN or inline
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export interface ParseLexiconResult {
  bookTitle: string;
  words: VocabItem[];
  totalParsed: number;
  warnings?: string[];
}

/**
 * Robust Text Line Parser: Extracts Word, POS, Hanja/Origin, Pronunciation, and Definition
 */
export function parseTextLineToVocabItem(
  line: string,
  index: number,
  category: string = 'Custom Lexicon',
  bookTitle: string = 'Uploaded Lexicon'
): VocabItem | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 2) return null;

  // Ignore page numbers, standalone numbers, or chapter headings
  if (/^(page|\d+|第[0-9一二三四五六七八九十]+[课单元课时章]|chapter|unit|lesson)/i.test(trimmed) && !/[\uac00-\ud7af]/.test(trimmed)) {
    return null;
  }

  // Must contain Korean characters (Hangul)
  const hasHangul = /[\uac00-\ud7a3]/.test(trimmed);
  if (!hasHangul) return null;

  let word = '';
  let hangul = '';
  let hanjaOrOrigin = '';
  let pronunciation = '';
  let pos = '명사 (名词)';
  let meaningZh = '';
  let meaningEn = '';
  let exampleKr = '';
  let exampleZh = '';

  // 1. Extract Bracketed Hanja/Origin like (韓語/漢字) or [漢字]
  const hanjaMatch = trimmed.match(/[（(]([\u4e00-\u9fa5A-Za-z0-9·\s]+)[)）]/);
  if (hanjaMatch) {
    hanjaOrOrigin = hanjaMatch[1].trim();
  }

  // 2. Extract Pronunciation [발음] or /pronunciation/
  const pronMatch = trimmed.match(/\[([\uac00-\ud7a3\s]+)\]/);
  if (pronMatch) {
    pronunciation = pronMatch[1].trim();
  }

  // 3. Extract POS tags like [명], [동], [형], (명), (동), n., v., adj., 名, 动, 形
  const posMatch = trimmed.match(/(?:\[|\(|（)(명|동|형|부|감|관|의|대|수|접|명사|동사|형용사|부사|감탄사|n|v|adj|adv|prep)(?:\]|\)|）)/i);
  if (posMatch) {
    const rawPos = posMatch[1].toLowerCase();
    if (rawPos.startsWith('명') || rawPos === 'n') pos = '명사 (名词)';
    else if (rawPos.startsWith('동') || rawPos === 'v') pos = '동사 (动词)';
    else if (rawPos.startsWith('형') || rawPos === 'adj') pos = '형용사 (形容词)';
    else if (rawPos.startsWith('부') || rawPos === 'adv') pos = '부사 (副词)';
    else if (rawPos.startsWith('감')) pos = '감탄사 (感叹词)';
    else if (rawPos.startsWith('관')) pos = '관형사 (冠形词)';
    else if (rawPos.startsWith('대')) pos = '대명사 (代词)';
    else pos = `${rawPos} (词性)`;
  }

  // 4. Tab / Comma / Multi-Space / Colon delimiter pattern check
  // E.g.: "가게 (可家) [가게] [명] 商店，小铺" or "가다 [동] 走，去" or "가방\tn. 包，书包"
  // Normalize string for delimiter separation
  const delimiters = ['\t', ' - ', ' — ', ' : ', '：', ' = ', '  '];
  let matchedDelimiter = '';
  for (const d of delimiters) {
    if (trimmed.includes(d)) {
      matchedDelimiter = d;
      break;
    }
  }

  if (matchedDelimiter) {
    const parts = trimmed.split(matchedDelimiter);
    const leftPart = parts[0].trim();
    const rightPart = parts.slice(1).join(' ').trim();

    // Extract hangul from left part
    const hangulMatch = leftPart.match(/([\uac00-\ud7a3]+(?:[~\s\w-]*[\uac00-\ud7a3]+)?)/);
    if (hangulMatch) {
      hangul = hangulMatch[1].trim();
      word = hangul;
    }

    meaningZh = rightPart
      .replace(/[\[\(（][^\]\)）]*[\]\)）]/g, '')
      .replace(/^(n|v|adj|adv|명|동|형|부)\.?\s*/i, '')
      .trim();
  } else {
    // Regex breakdown for combined line
    // Look for first Hangul chunk, then everything following as definitions
    const hangulChunkMatch = trimmed.match(/^([\uac00-\ud7a3]+(?:[\s-][\uac00-\ud7a3]+)*)/);
    if (hangulChunkMatch) {
      hangul = hangulChunkMatch[1].trim();
      word = hangul;
      const rest = trimmed.substring(hangulChunkMatch[0].length).trim();
      
      // Clean brackets and take Chinese/English definition
      meaningZh = rest
        .replace(/^[\[\(（][^\]\)）]*[\]\)）]\s*/, '')
        .replace(/^[\[\(（][^\]\)）]*[\]\)）]\s*/, '')
        .trim();
    }
  }

  if (!hangul || !meaningZh) {
    // Fallback: If contains Hangul and Chinese, split by regex
    const krMatch = trimmed.match(/([\uac00-\ud7a3\s~-]+)/);
    const zhMatch = trimmed.match(/([\u4e00-\u9fa5\w\s，,。；;、]+)/);
    if (krMatch && zhMatch) {
      hangul = krMatch[1].trim();
      word = hangul;
      meaningZh = zhMatch[1].trim();
    }
  }

  if (!hangul || hangul.length < 1) return null;
  if (!meaningZh || meaningZh.length < 1) {
    meaningZh = '词汇解析中';
  }

  // Generate clean default example if none present
  exampleKr = `${hangul}을/를 사용한 실전 표현이에요.`;
  exampleZh = `关于“${meaningZh}”的实战表达。`;

  return {
    id: `lex_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`,
    word: hangul,
    hangul: hangul,
    hanja_or_root: hanjaOrOrigin || undefined,
    romanization: pronunciation || undefined,
    type: pos,
    meaning_zh: meaningZh,
    meaning_en: meaningEn || meaningZh,
    category: category,
    level: bookTitle.includes('延世') ? 'Yonsei' : bookTitle.includes('TOPIK') ? 'TOPIK' : 'Custom',
    source: bookTitle,
    example_kr: exampleKr,
    example_zh: exampleZh,
    mastery: 'new',
    isBookmarked: false,
    savedAt: Date.now(),
  };
}

/**
 * Parse Raw Text (TXT / String)
 */
export function parseRawTextLexicon(
  text: string,
  categoryName: string = 'Uploaded Lexicon',
  bookTitle: string = 'Custom Book'
): ParseLexiconResult {
  const lines = text.split(/\r?\n/);
  const items: VocabItem[] = [];
  const seenHangul = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const item = parseTextLineToVocabItem(lines[i], i, categoryName, bookTitle);
    if (item && item.hangul && !seenHangul.has(item.hangul)) {
      seenHangul.add(item.hangul);
      items.push(item);
    }
  }

  return {
    bookTitle,
    words: items,
    totalParsed: items.length,
  };
}

/**
 * Parse CSV Content
 */
export function parseCSVLexicon(
  csvText: string,
  categoryName: string = 'CSV Lexicon',
  bookTitle: string = 'CSV Book'
): ParseLexiconResult {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { bookTitle, words: [], totalParsed: 0 };

  const items: VocabItem[] = [];
  const seen = new Set<string>();

  // Determine headers if available
  const headerLine = lines[0].toLowerCase();
  const isHeader = headerLine.includes('word') || headerLine.includes('hangul') || headerLine.includes('单词') || headerLine.includes('한글');
  const startIndex = isHeader ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const row = lines[i];
    // Split by comma ignoring inside quotes
    const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
    if (cols.length === 0) continue;

    const hangul = cols[0] || '';
    if (!/[\uac00-\ud7a3]/.test(hangul)) {
      // Try next column
      continue;
    }

    const meaningZh = cols[1] || cols[2] || '标准释义';
    const type = cols.length > 2 && cols[2].length < 10 ? cols[2] : '명사 (名词)';
    const exampleKr = cols[3] || `${hangul}을/를 자주 써요.`;
    const exampleZh = cols[4] || `经常使用“${meaningZh}”。`;

    if (!seen.has(hangul)) {
      seen.add(hangul);
      items.push({
        id: `csv_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        word: hangul,
        hangul,
        type,
        meaning_zh: meaningZh,
        meaning_en: meaningZh,
        category: categoryName,
        level: 'Custom',
        source: bookTitle,
        example_kr: exampleKr,
        example_zh: exampleZh,
        mastery: 'new',
        isBookmarked: false,
        savedAt: Date.now(),
      });
    }
  }

  return {
    bookTitle,
    words: items,
    totalParsed: items.length,
  };
}

/**
 * Parse JSON Content
 */
export function parseJSONLexicon(
  jsonText: string,
  categoryName: string = 'JSON Lexicon',
  bookTitle: string = 'JSON Book'
): ParseLexiconResult {
  try {
    const parsed = JSON.parse(jsonText);
    const list: any[] = Array.isArray(parsed) ? parsed : (parsed.words || parsed.vocabulary || parsed.items || []);
    const items: VocabItem[] = [];
    const seen = new Set<string>();

    list.forEach((entry, idx) => {
      const hangul = entry.hangul || entry.word || entry.korean || entry.kr || '';
      if (!hangul || !/[\uac00-\ud7a3]/.test(hangul)) return;

      if (!seen.has(hangul)) {
        seen.add(hangul);
        items.push({
          id: `json_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          word: hangul,
          hangul,
          hanja_or_root: entry.hanja_or_root || entry.hanja || entry.origin,
          romanization: entry.romanization || entry.pronunciation,
          type: entry.type || entry.pos || '명사 (名词)',
          meaning_zh: entry.meaning_zh || entry.meaning || entry.definition || entry.zh || '释义',
          meaning_en: entry.meaning_en || entry.en,
          category: entry.category || categoryName,
          level: entry.level || 'Custom',
          source: bookTitle,
          example_kr: entry.example_kr || entry.example_ko || entry.example,
          example_zh: entry.example_zh || entry.translation,
          origin: entry.origin,
          full_form: entry.full_form,
          social_nuance: entry.social_nuance,
          mastery: 'new',
          isBookmarked: false,
          savedAt: Date.now(),
        });
      }
    });

    return {
      bookTitle: parsed.title || bookTitle,
      words: items,
      totalParsed: items.length,
    };
  } catch (err: any) {
    throw new Error(`JSON 格式解析失败: ${err.message}`);
  }
}

/**
 * Client-side PDF Parser using pdfjs-dist
 */
export async function parsePDFLexicon(
  file: File,
  onProgress?: (progress: number, currentText: string) => void
): Promise<ParseLexiconResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  let fullText = '';

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');

    fullText += pageText + '\n';

    if (onProgress) {
      onProgress(Math.round((pageNum / numPages) * 100), `正在解析第 ${pageNum}/${numPages} 页文本...`);
    }
  }

  const cleanBookName = file.name.replace(/\.[^/.]+$/, '');
  return parseRawTextLexicon(fullText, 'PDF Lexicon', cleanBookName);
}
