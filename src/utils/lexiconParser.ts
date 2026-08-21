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
 * Normalizes POS tags to standard readable Korean/Chinese
 */
function normalizePOS(rawPos: string): string {
  const p = rawPos.toLowerCase().trim();
  if (p.startsWith('명') || p === 'n' || p === 'noun' || p.includes('名词')) return '명사 (名词)';
  if (p.startsWith('동') || p === 'v' || p === 'verb' || p.includes('动词')) return '동사 (动词)';
  if (p.startsWith('형') || p === 'adj' || p === 'adjective' || p.includes('形容词')) return '형용사 (形容词)';
  if (p.startsWith('부') || p === 'adv' || p === 'adverb' || p.includes('副词')) return '부사 (副词)';
  if (p.startsWith('감') || p === 'interj' || p.includes('感叹')) return '감탄사 (感叹词)';
  if (p.startsWith('관') || p.includes('冠形')) return '관형사 (冠形词)';
  if (p.startsWith('대') || p === 'pron' || p.includes('代词')) return '대명사 (代词)';
  if (p.startsWith('수') || p === 'num' || p.includes('数词')) return '수사 (数词)';
  if (p.startsWith('조') || p.includes('助词')) return '조사 (助词)';
  if (p.startsWith('접') || p === 'conj' || p.includes('接续') || p.includes('连词')) return '접속사 (连词)';
  if (p.includes('신조') || p.includes('流行') || p.includes('俚语')) return '신조어 (流行语)';
  return '어휘 (常用词汇)';
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
  let trimmed = line.trim();
  if (!trimmed || trimmed.length < 2) return null;

  // Ignore pure chapter headers, page indicators, or pure separators
  if (/^(page|\d+|第[0-9一二三四五六七八九十]+[课单元课时章节]|chapter|unit|lesson|section)\b/i.test(trimmed) && !/[\uac00-\ud7af]/.test(trimmed)) {
    return null;
  }
  if (/^[=\-_*#]{3,}$/.test(trimmed)) return null;

  // Must contain Korean characters (Hangul)
  const hasHangul = /[\uac00-\ud7a3]/.test(trimmed);
  if (!hasHangul) return null;

  // Strip leading list numbers / bullet points like "1.", "01.", "①", "(1)", "•", "-"
  trimmed = trimmed.replace(/^(\d+[\.、\)\s]+|[①②③④⑤⑥⑦⑧⑨⑩\(\[\{]\d+[\)\]\}]\s*|[•·\-\*]\s*)/, '').trim();

  let word = '';
  let hangul = '';
  let hanjaOrOrigin = '';
  let pronunciation = '';
  let pos = '명사 (名词)';
  let meaningZh = '';
  let meaningEn = '';
  let exampleKr = '';
  let exampleZh = '';

  // 1. Extract Example sentences if embedded: e.g. "예: ... / 例: ... / ex: ..."
  const exMatch = trimmed.match(/(?:예|例|예문|ex|Example)[\s:：]+([^\(\[\{]+?)(?:[\(（](.+?)[\)）]|(?:——|--|-)\s*(.+)|$)/i);
  if (exMatch) {
    exampleKr = exMatch[1].trim();
    exampleZh = (exMatch[2] || exMatch[3] || '').trim();
    // Remove example part from trimmed to parse word/meaning cleanly
    trimmed = trimmed.substring(0, exMatch.index).trim();
  }

  // 2. Extract Bracketed Hanja/Origin like (韓語/漢字) or [漢字] or 【漢字】
  const hanjaMatch = trimmed.match(/[（(【]([\u4e00-\u9fa5A-Za-z0-9·\s\-–]+)[)）】]/);
  if (hanjaMatch && /[\u4e00-\u9fa5]/.test(hanjaMatch[1])) {
    hanjaOrOrigin = hanjaMatch[1].trim();
  }

  // 3. Extract Pronunciation [발음] or /발음/
  const pronMatch = trimmed.match(/[\[\/]([\uac00-\ud7a3\s]+)[\]\/]/);
  if (pronMatch) {
    pronunciation = pronMatch[1].trim();
  }

  // 4. Extract POS tags like [명], [동], [형], (명), (동), n., v., adj., 名, 动, 形
  const posMatch = trimmed.match(/(?:\[|\(|（|【)(명|동|형|부|감|관|의|대|수|조|접|명사|동사|형용사|부사|감탄사|신조어|n|v|adj|adv|prep|conj)(?:\]|\)|）|】)/i);
  if (posMatch) {
    pos = normalizePOS(posMatch[1]);
  } else {
    // Check dot pos like "n. " or "v. " or "名. " or "动. "
    const dotPosMatch = trimmed.match(/\b(n|v|adj|adv|prep|명|동|형|부|名|动|形|副)\.\s*/i);
    if (dotPosMatch) {
      pos = normalizePOS(dotPosMatch[1]);
    }
  }

  // 5. Delimiter pattern check (Tab, colon, comma, dashes, pipes, slashes, double space)
  const delimiters = [
    '\t',
    ' \t ',
    ' | ',
    '｜',
    ' — ',
    ' – ',
    ' - ',
    ' : ',
    '：',
    ' = ',
    ' / ',
    '，',
    ', ',
    '  '
  ];

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
      .replace(/[\[\(（【][^\]\)）】]*[\]\)）】]/g, '')
      .replace(/^(n|v|adj|adv|명|동|형|부|名|动|形|副)\.?\s*/i, '')
      .trim();
  } else {
    // 6. Direct boundary parsing (e.g. "가게 商店", "가방 书包，手提包", "안녕하세요 你好")
    // Match the leading Korean word (including compound spaces or particles)
    const hangulChunkMatch = trimmed.match(/^([\uac00-\ud7a3]+(?:[\s\-~][\uac00-\ud7a3]+)*)/);
    if (hangulChunkMatch) {
      hangul = hangulChunkMatch[1].trim();
      word = hangul;
      const rest = trimmed.substring(hangulChunkMatch[0].length).trim();
      
      // Clean brackets and take Chinese/English definition
      meaningZh = rest
        .replace(/^[\[\(（【][^\]\)）】]*[\]\)）】]\s*/, '')
        .replace(/^[\[\(（【][^\]\)）】]*[\]\)）】]\s*/, '')
        .replace(/^(n|v|adj|adv|명|동|형|부|名|动|形|副)\.?\s*/i, '')
        .trim();
    }
  }

  // 7. Fallback: regex split by Korean block and Chinese block
  if (!hangul || !meaningZh) {
    const krMatch = trimmed.match(/([\uac00-\ud7a3\s~-]+)/);
    const zhMatch = trimmed.match(/([\u4e00-\u9fa5\w\s，,。；;、~·！!？?]+)/);
    if (krMatch && zhMatch) {
      hangul = krMatch[1].trim();
      word = hangul;
      meaningZh = zhMatch[1].trim();
    }
  }

  if (!hangul || hangul.length < 1) return null;

  // Clean trailing punctuation or parentheses from hangul
  hangul = hangul.replace(/^[\(\[\{]/, '').replace(/[\)\]\}]$/, '').trim();
  word = hangul;

  // Clean meaning
  if (!meaningZh || meaningZh.length < 1) {
    meaningZh = '词汇解析中';
  } else {
    meaningZh = meaningZh.replace(/^[:：\-—=\s]+/, '').trim();
  }

  // Auto-detect POS from Korean suffix if not explicitly detected
  if (pos === '명사 (名词)') {
    if (hangul.endsWith('하다') || hangul.endsWith('되다') || hangul.endsWith('거리다')) {
      pos = '동사 (动词)';
    } else if (hangul.endsWith('스럽다') || hangul.endsWith('롭다') || hangul.endsWith('답다') || hangul.endsWith('다') && (meaningZh.includes('的') || meaningZh.includes('感到'))) {
      pos = '형용사 (形容词)';
    } else if (hangul.endsWith('히') || hangul.endsWith('이') && meaningZh.includes('地')) {
      pos = '부사 (副词)';
    }
  }

  // Generate clean default example if none present
  if (!exampleKr) {
    exampleKr = `${hangul}을/를 사용한 실전 표현이에요.`;
  }
  if (!exampleZh) {
    exampleZh = `关于“${meaningZh}”的实战表达。`;
  }

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
 * Parse Raw Text (TXT / String / PDF Pages) with single-line & multi-line pairing support
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
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Check if line contains multiple entries separated by semicolons (e.g. "가방: 包; 지갑: 钱包")
    if (rawLine.includes(';') || rawLine.includes('；')) {
      const subEntries = rawLine.split(/[;；]/).filter(s => s.trim().length > 0);
      if (subEntries.length > 1) {
        for (const sub of subEntries) {
          const subItem = parseTextLineToVocabItem(sub, items.length, categoryName, bookTitle);
          if (subItem && subItem.hangul && !seenHangul.has(subItem.hangul)) {
            seenHangul.add(subItem.hangul);
            items.push(subItem);
          }
        }
        continue;
      }
    }

    // Try parsing single line
    const item = parseTextLineToVocabItem(rawLine, items.length, categoryName, bookTitle);
    if (item && item.hangul && item.meaning_zh && item.meaning_zh !== '词汇解析中' && !seenHangul.has(item.hangul)) {
      seenHangul.add(item.hangul);
      items.push(item);
      continue;
    }

    // Multi-line pairing fallback:
    // If line i is pure Korean (e.g. "가방") and line i+1 is Chinese/meaning (e.g. "书包，手提包")
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      const isLineHangulOnly = /^[\uac00-\ud7a3\s~-]+$/.test(rawLine);
      const isNextLineMeaning = /[\u4e00-\u9fa5]/.test(nextLine) && !/[\uac00-\ud7a3]/.test(nextLine);

      if (isLineHangulOnly && isNextLineMeaning) {
        const combined = `${rawLine} - ${nextLine}`;
        const pairedItem = parseTextLineToVocabItem(combined, items.length, categoryName, bookTitle);
        if (pairedItem && pairedItem.hangul && !seenHangul.has(pairedItem.hangul)) {
          seenHangul.add(pairedItem.hangul);
          items.push(pairedItem);
          i++; // Skip nextLine as it was consumed
          continue;
        }
      }
    }

    // If single line had hangul even if meaning defaulted, accept it
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
 * Parse CSV / TSV Content with delimiter and header auto-detection
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

  // Determine delimiter (comma, tab, semicolon, pipe)
  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';
  else if (firstLine.includes('|') && !firstLine.includes(',')) delimiter = '|';

  // Determine headers
  const headerCols = firstLine.toLowerCase().split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());
  const isHeader = headerCols.some(h => 
    h.includes('word') || h.includes('hangul') || h.includes('korean') || 
    h.includes('单词') || h.includes('韩语') || h.includes('한글') || h.includes('단어')
  );

  let hangulCol = 0;
  let meaningCol = 1;
  let posCol = -1;
  let hanjaCol = -1;
  let exKrCol = -1;
  let exZhCol = -1;

  if (isHeader) {
    headerCols.forEach((col, idx) => {
      if (col.includes('hangul') || col.includes('word') || col.includes('korean') || col.includes('한글') || col.includes('단어') || col.includes('韩语')) {
        hangulCol = idx;
      } else if (col.includes('meaning') || col.includes('definition') || col.includes('zh') || col.includes('释义') || col.includes('中文') || col.includes('意思')) {
        meaningCol = idx;
      } else if (col.includes('pos') || col.includes('type') || col.includes('词性') || col.includes('품사')) {
        posCol = idx;
      } else if (col.includes('hanja') || col.includes('origin') || col.includes('汉字') || col.includes('词源')) {
        hanjaCol = idx;
      } else if (col.includes('example_kr') || col.includes('example_ko') || col.includes('예문') || col.includes('例句')) {
        exKrCol = idx;
      } else if (col.includes('example_zh') || col.includes('translation') || col.includes('翻译')) {
        exZhCol = idx;
      }
    });
  }

  const startIndex = isHeader ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const row = lines[i];
    // Split by delimiter respecting quotes
    let cols: string[];
    if (delimiter === ',') {
      cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
    } else {
      cols = row.split(delimiter).map(c => c.replace(/^"|"$/g, '').trim());
    }
    if (cols.length === 0) continue;

    let hangul = cols[hangulCol] || '';
    if (!/[\uac00-\ud7a3]/.test(hangul)) {
      // Search columns for first Hangul
      const foundIdx = cols.findIndex(c => /[\uac00-\ud7a3]/.test(c));
      if (foundIdx !== -1) {
        hangul = cols[foundIdx];
      } else {
        continue;
      }
    }

    const rawMeaning = (meaningCol < cols.length && cols[meaningCol]) ? cols[meaningCol] : (cols[1] || cols[2] || '标准释义');
    const type = (posCol !== -1 && cols[posCol]) ? normalizePOS(cols[posCol]) : (cols.length > 2 && cols[2].length < 10 && !/[\u4e00-\u9fa5]{3,}/.test(cols[2]) ? normalizePOS(cols[2]) : '명사 (名词)');
    const hanja = hanjaCol !== -1 ? cols[hanjaCol] : undefined;
    const exampleKr = exKrCol !== -1 && cols[exKrCol] ? cols[exKrCol] : `${hangul}을/를 자주 써요.`;
    const exampleZh = exZhCol !== -1 && cols[exZhCol] ? cols[exZhCol] : `经常使用“${rawMeaning}”。`;

    if (!seen.has(hangul)) {
      seen.add(hangul);
      items.push({
        id: `csv_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        word: hangul,
        hangul,
        hanja_or_root: hanja,
        type,
        meaning_zh: rawMeaning,
        meaning_en: rawMeaning,
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
 * Parse JSON Content (Array of objects, {words: []}, or Key-Value map)
 */
export function parseJSONLexicon(
  jsonText: string,
  categoryName: string = 'JSON Lexicon',
  bookTitle: string = 'JSON Book'
): ParseLexiconResult {
  try {
    const parsed = JSON.parse(jsonText);
    const items: VocabItem[] = [];
    const seen = new Set<string>();

    if (Array.isArray(parsed)) {
      parsed.forEach((entry, idx) => {
        const hangul = entry.hangul || entry.word || entry.korean || entry.kr || entry.단어 || '';
        if (!hangul || !/[\uac00-\ud7a3]/.test(hangul)) return;

        if (!seen.has(hangul)) {
          seen.add(hangul);
          items.push({
            id: `json_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
            word: hangul,
            hangul,
            hanja_or_root: entry.hanja_or_root || entry.hanja || entry.origin || entry.hanja_or_origin,
            romanization: entry.romanization || entry.pronunciation,
            type: normalizePOS(entry.type || entry.pos || entry.품사 || '명사'),
            meaning_zh: entry.meaning_zh || entry.meaning || entry.definition || entry.definition_zh || entry.zh || entry.뜻 || '释义',
            meaning_en: entry.meaning_en || entry.en,
            category: entry.category || categoryName,
            level: entry.level || 'Custom',
            source: bookTitle,
            example_kr: entry.example_kr || entry.example_ko || entry.example || `${hangul} 실전 예문이에요.`,
            example_zh: entry.example_zh || entry.translation || '实战例句翻译。',
            origin: entry.origin,
            full_form: entry.full_form,
            social_nuance: entry.social_nuance,
            mastery: 'new',
            isBookmarked: false,
            savedAt: Date.now(),
          });
        }
      });
    } else if (typeof parsed === 'object' && parsed !== null) {
      // Check if wrapped in words / vocabulary / items / data list
      const list: any[] = parsed.words || parsed.vocabulary || parsed.items || parsed.data || [];
      if (list.length > 0) {
        return parseJSONLexicon(JSON.stringify(list), categoryName, parsed.title || bookTitle);
      }

      // Check if it's a key-value dictionary { "가게": "商店", "가방": "书包" }
      Object.entries(parsed).forEach(([key, val], idx) => {
        if (!/[\uac00-\ud7a3]/.test(key)) return;
        const hangul = key.trim();
        let meaningZh = '释义';
        let pos = '명사 (名词)';
        let hanja: string | undefined = undefined;

        if (typeof val === 'string') {
          meaningZh = val;
        } else if (typeof val === 'object' && val !== null) {
          const vObj = val as any;
          meaningZh = vObj.meaning_zh || vObj.meaning || vObj.definition || vObj.zh || '释义';
          pos = normalizePOS(vObj.type || vObj.pos || '명사');
          hanja = vObj.hanja || vObj.origin;
        }

        if (!seen.has(hangul)) {
          seen.add(hangul);
          items.push({
            id: `json_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
            word: hangul,
            hangul,
            hanja_or_root: hanja,
            type: pos,
            meaning_zh: meaningZh,
            meaning_en: meaningZh,
            category: categoryName,
            level: 'Custom',
            source: bookTitle,
            example_kr: `${hangul} 실전 표현이에요.`,
            example_zh: `关于“${meaningZh}”的实战表达。`,
            mastery: 'new',
            isBookmarked: false,
            savedAt: Date.now(),
          });
        }
      });
    }

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

