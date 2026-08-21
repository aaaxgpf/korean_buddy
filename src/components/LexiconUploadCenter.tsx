import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  BookOpen, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Plus, 
  ArrowRight,
  Download,
  Loader2,
  RefreshCw,
  Search,
  Check,
  Zap,
  Volume2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VocabItem, CustomLexiconBook, AISeedExpansionResult } from '../types';
import { parsePDFLexicon, parseJSONLexicon, parseCSVLexicon, parseRawTextLexicon } from '../utils/lexiconParser';
import { PRESET_CUSTOM_BOOKS } from '../data/presetLexicons';
import { speakKorean } from '../utils/audio';

interface Props {
  onImportWords: (newWords: VocabItem[], book: CustomLexiconBook) => void;
  onSelectBookForStudy?: (book: CustomLexiconBook) => void;
  totalVocabCount: number;
}

export const LexiconUploadCenter: React.FC<Props> = ({
  onImportWords,
  onSelectBookForStudy,
  totalVocabCount
}) => {
  // Saved Custom Books from LocalStorage
  const [customBooks, setCustomBooks] = useState<CustomLexiconBook[]>(() => {
    try {
      const saved = localStorage.getItem('korean_buddy_custom_lexicon');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load custom lexicon books', e);
    }
    return PRESET_CUSTOM_BOOKS;
  });

  const [selectedBookId, setSelectedBookId] = useState<string>(() => {
    return customBooks[0]?.id || 'preset_yonsei_vol1';
  });

  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseStatusText, setParseStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // AI Seed Expansion state
  const [isExpanding, setIsExpanding] = useState(false);
  const [lastExpansionResult, setLastExpansionResult] = useState<AISeedExpansionResult | null>(null);

  // Preview & Search
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist customBooks to localStorage
  useEffect(() => {
    localStorage.setItem('korean_buddy_custom_lexicon', JSON.stringify(customBooks));
  }, [customBooks]);

  const activeBook = customBooks.find(b => b.id === selectedBookId) || customBooks[0];

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['pdf', 'json', 'csv', 'txt'].includes(ext)) {
      setErrorMessage('仅支持上传 .pdf, .json, .csv 或 .txt 格式的词书文件');
      return;
    }

    setErrorMessage(null);
    setIsParsing(true);
    setParseProgress(15);
    setParseStatusText(`正在读取 ${file.name}...`);

    try {
      let parsedResult: { bookTitle: string; words: VocabItem[]; totalParsed: number };
      const baseName = file.name.replace(/\.[^/.]+$/, '');

      if (ext === 'pdf') {
        setParseStatusText('正在通过客户端 PDF 解析引擎提取标准词条...');
        parsedResult = await parsePDFLexicon(file, (p, text) => {
          setParseProgress(Math.min(90, Math.max(20, p)));
          setParseStatusText(text);
        });
      } else if (ext === 'json') {
        const text = await file.text();
        setParseProgress(60);
        parsedResult = parseJSONLexicon(text, baseName, baseName);
      } else if (ext === 'csv') {
        const text = await file.text();
        setParseProgress(60);
        parsedResult = parseCSVLexicon(text, baseName, baseName);
      } else {
        // txt
        const text = await file.text();
        setParseProgress(60);
        parsedResult = parseRawTextLexicon(text, baseName, baseName);
      }

      setParseProgress(100);

      if (!parsedResult.words || parsedResult.words.length === 0) {
        setErrorMessage('未能从文件中解析出有效的韩语单词，请检查文件格式是否包含韩文字符。');
        setIsParsing(false);
        return;
      }

      const newBook: CustomLexiconBook = {
        id: `book_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: baseName.includes('延世') ? baseName : `《${baseName}》自定义词书`,
        description: `包含 ${parsedResult.words.length} 个结构化词条，已完成词性与例句智能清洗`,
        fileName: file.name,
        fileType: ext as any,
        fileSize: file.size,
        totalWords: parsedResult.words.length,
        importedAt: Date.now(),
        category: baseName,
        words: parsedResult.words,
      };

      setCustomBooks(prev => [newBook, ...prev]);
      setSelectedBookId(newBook.id);
      onImportWords(parsedResult.words, newBook);

      setSuccessBanner(`已成功导入《${newBook.title}》共 ${parsedResult.words.length} 词！已自动存入本地词库并同步打卡系统。`);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });

      // Clear banner after 6s
      setTimeout(() => setSuccessBanner(null), 6000);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMessage(`解析失败: ${err?.message || '请确认文件格式'}`);
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // AI Seed Expansion
  const handleTriggerAIExpansion = async () => {
    if (!activeBook || activeBook.words.length === 0) return;
    setIsExpanding(true);
    setErrorMessage(null);

    try {
      // Pick 8 representative seed words
      const seedWords = activeBook.words
        .slice(0, 15)
        .map(w => w.hangul || w.word)
        .sort(() => Math.random() - 0.5)
        .slice(0, 8);

      const res = await fetch('/api/curriculum/expand-lexicon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: activeBook.title,
          seedWords,
          count: 6,
        }),
      });

      if (!res.ok) throw new Error('AI 衍生接口请求失败');
      const data: AISeedExpansionResult = await res.json();

      setLastExpansionResult(data);

      // Merge expanded items into current book and vocabulary
      if (data.expandedItems && data.expandedItems.length > 0) {
        const updatedBook: CustomLexiconBook = {
          ...activeBook,
          totalWords: activeBook.totalWords + data.expandedItems.length,
          expandedCount: (activeBook.expandedCount || 0) + data.expandedItems.length,
          words: [...data.expandedItems, ...activeBook.words],
        };

        setCustomBooks(prev => prev.map(b => b.id === activeBook.id ? updatedBook : b));
        onImportWords(data.expandedItems, updatedBook);
        confetti({ particleCount: 45, spread: 60 });
        setSuccessBanner(`✨ 成功基于《${activeBook.title}》种子词衍生了 ${data.expandedItems.length} 个地道实战词条与新题库！`);
        setTimeout(() => setSuccessBanner(null), 6000);
      }
    } catch (err: any) {
      console.error('AI expansion error:', err);
      setErrorMessage(`AI 实时衍生拓展失败: ${err?.message || '服务暂时不可用'}`);
    } finally {
      setIsExpanding(false);
    }
  };

  const handleDeleteBook = (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这本词书吗？')) {
      const filtered = customBooks.filter(b => b.id !== bookId);
      setCustomBooks(filtered);
      if (selectedBookId === bookId && filtered.length > 0) {
        setSelectedBookId(filtered[0].id);
      }
    }
  };

  // Filter words in preview
  const previewWords = (activeBook?.words || []).filter(w => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      w.hangul.toLowerCase().includes(q) ||
      w.word.toLowerCase().includes(q) ||
      w.meaning_zh.toLowerCase().includes(q) ||
      (w.hanja_or_root && w.hanja_or_root.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Title & Stats Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Layers size={20} className="text-stone-800" />
            <span>自定义词书与 AI 扩充引擎</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            支持 PDF / JSON / CSV / TXT 智能导入与本地持久化，无缝驱动打卡与测试
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-[6px] bg-[#F4F4F6] border border-stone-200 text-stone-800 text-xs font-mono">
            已导入 <strong className="text-stone-900 font-bold">{customBooks.length}</strong> 本词书
          </div>
          <div className="px-3 py-1.5 rounded-[6px] bg-[#F4F4F6] border border-stone-200 text-stone-800 text-xs font-mono">
            总词库 <strong className="text-stone-900 font-bold">{totalVocabCount}</strong> 词
          </div>
        </div>
      </div>

      {/* Success & Error Banners */}
      {successBanner && (
        <div className="p-3.5 rounded-[6px] bg-stone-900 text-white text-xs flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-stone-400 hover:text-white text-[11px] underline">
            关闭
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-[6px] bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-800 text-[11px] underline">
            关闭
          </button>
        </div>
      )}

      {/* Part 1: Drag & Drop Upload Zone (Micro-rounded dashed box) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-6 sm:p-8 rounded-[6px] border border-dashed text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'bg-stone-200/80 border-stone-800 scale-[0.99]'
            : 'bg-[#F9FAFB] border-stone-300 hover:bg-stone-100 hover:border-stone-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.json,.csv,.txt"
          onChange={handleFileInput}
          className="hidden"
        />

        {isParsing ? (
          <div className="space-y-3 py-3 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 text-stone-900 font-semibold text-xs">
              <Loader2 size={16} className="animate-spin text-stone-800" />
              <span>{parseStatusText}</span>
            </div>
            {/* Minimalist Monochrome Progress Bar */}
            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-stone-900 h-full transition-all duration-300 rounded-full"
                style={{ width: `${parseProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-500 font-mono">
              纯前端解析与数据归一化清洗中: {parseProgress}%
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-[6px] bg-white border border-stone-200 mx-auto flex items-center justify-center text-stone-800 shadow-2xs">
              <Upload size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900">
                点击或拖拽词书文件至此处上传
              </p>
              <p className="text-xs text-stone-500 mt-1">
                支持 <span className="font-mono text-stone-800 font-medium">.PDF</span>（如延世韩国语 Vol.1~6 词汇手册）、<span className="font-mono text-stone-800 font-medium">.JSON</span>、<span className="font-mono text-stone-800 font-medium">.CSV</span> 或 <span className="font-mono text-stone-800 font-medium">.TXT</span>
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-white border border-stone-200 text-[11px] text-stone-600 font-mono">
              <span>自动提取韩文单词 · 词性 · 汉字词源 · 纯正发音 · 释义</span>
            </div>
          </div>
        )}
      </div>

      {/* Part 2: Lexicon Books List & Management Shelf */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            我的词书库 ({customBooks.length})
          </h3>
          <span className="text-[11px] text-stone-400">
            数据已本地持久化保存 (LocalStorage)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {customBooks.map(book => {
            const isSelected = book.id === selectedBookId;
            return (
              <div
                key={book.id}
                onClick={() => setSelectedBookId(book.id)}
                className={`p-4 rounded-[6px] border text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#F4F4F6] border-stone-800 shadow-2xs'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[4px] bg-white border border-stone-200 flex items-center justify-center shrink-0 text-stone-800 font-mono text-xs font-bold">
                      {book.fileType.toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-stone-900 line-clamp-1">
                        {book.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {book.totalWords} 词 {book.expandedCount ? `(+${book.expandedCount} AI衍生)` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-[4px] bg-stone-900 text-white text-[10px] font-medium">
                        当前选中
                      </span>
                    )}
                    {book.fileType !== 'preset' && (
                      <button
                        onClick={(e) => handleDeleteBook(book.id, e)}
                        className="p-1 text-stone-400 hover:text-red-600 rounded hover:bg-stone-100 transition-colors"
                        title="删除词书"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {book.description && (
                  <p className="text-[11px] text-stone-500 mt-2 line-clamp-2 leading-relaxed">
                    {book.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Part 3: Active Book Details & AI Seed Expansion Action Bar */}
      {activeBook && (
        <div className="p-5 rounded-[6px] bg-[#F4F4F6] border border-stone-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-900">{activeBook.title}</h3>
                <span className="px-2 py-0.5 rounded-[4px] bg-white border border-stone-200 text-stone-700 text-[10px] font-mono">
                  {activeBook.category}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                包含 {activeBook.words.length} 个精选词汇 · 支持一键发起打卡与实战演练
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {onSelectBookForStudy && (
                <button
                  onClick={() => onSelectBookForStudy(activeBook)}
                  className="px-3.5 py-1.5 rounded-[6px] bg-stone-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <BookOpen size={13} />
                  <span>以此词书开启三阶段打卡</span>
                </button>
              )}

              <button
                onClick={handleTriggerAIExpansion}
                disabled={isExpanding}
                className="px-3.5 py-1.5 rounded-[6px] bg-white hover:bg-stone-100 border border-stone-300 text-stone-900 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-2xs"
              >
                {isExpanding ? (
                  <>
                    <Loader2 size={13} className="animate-spin text-stone-800" />
                    <span>AI 实时衍生题库中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} className="text-stone-800" />
                    <span>✨ 基于此词书生成新题库/新例句</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Seed Expansion Feedback Banner */}
          {lastExpansionResult && (
            <div className="p-3.5 rounded-[6px] bg-white border border-stone-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-900">
                <span className="flex items-center gap-1.5">
                  <Zap size={14} className="text-stone-800" />
                  <span>最新 AI 种子拓展成果：已生成 {lastExpansionResult.expandedItems.length} 个实战词条与默写新题</span>
                </span>
                <span className="text-[10px] text-stone-500 font-mono">
                  种子词: {lastExpansionResult.seedWords?.slice(0, 4).join(', ')}
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                {lastExpansionResult.expandedItems.map(item => (
                  <span key={item.id} className="px-2.5 py-1 rounded-[4px] bg-[#F4F4F6] border border-stone-200 text-stone-800 text-[11px] shrink-0">
                    <strong className="font-bold">{item.hangul}</strong>: {item.meaning_zh}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Words Preview Table & Quick Search */}
          <div className="space-y-2 pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-stone-700">
                词条预览 ({previewWords.length} / {activeBook.words.length})
              </span>
              <div className="relative w-48 sm:w-64">
                <Search size={13} className="absolute left-2.5 top-2.5 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索韩语或中文释义..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-stone-200 rounded-[4px] text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-500"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-[6px] border border-stone-200 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F9FAFB] text-stone-600 sticky top-0 border-b border-stone-200">
                  <tr>
                    <th className="py-2 px-3 font-semibold text-[11px]">韩语 (Hangul)</th>
                    <th className="py-2 px-3 font-semibold text-[11px]">词性/词源</th>
                    <th className="py-2 px-3 font-semibold text-[11px]">中文释义</th>
                    <th className="py-2 px-3 font-semibold text-[11px]">实战例句</th>
                    <th className="py-2 px-3 text-right font-semibold text-[11px]">发音</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {previewWords.slice(0, 50).map(item => (
                    <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-2 px-3">
                        <span className="font-bold text-stone-900">{item.hangul || item.word}</span>
                      </td>
                      <td className="py-2 px-3 text-stone-500 text-[11px]">
                        <span>{item.type}</span>
                        {item.hanja_or_root && (
                          <span className="ml-1 text-stone-400">({item.hanja_or_root})</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-stone-800 font-medium">{item.meaning_zh}</td>
                      <td className="py-2 px-3 text-stone-500 text-[11px] max-w-xs truncate" title={item.example_kr}>
                        {item.example_kr || '-'}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => speakKorean(item.hangul || item.word)}
                          className="p-1 rounded text-stone-400 hover:text-stone-900 hover:bg-stone-100"
                        >
                          <Volume2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewWords.length === 0 && (
                <div className="p-6 text-center text-xs text-stone-400">
                  未找到匹配的词汇
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
