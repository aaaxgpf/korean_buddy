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
  Volume2,
  Edit3,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FolderOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VocabItem, CustomLexiconBook, AISeedExpansionResult } from '../types';
import { parsePDFLexicon, parseJSONLexicon, parseCSVLexicon, parseRawTextLexicon } from '../utils/lexiconParser';
import { PRESET_CUSTOM_BOOKS } from '../data/presetLexicons';
import { sanitizeVocabItem } from '../utils/koreanDictionary';
import { speakKorean } from '../utils/audio';
import { notifyToast, formatApiErrorMessage } from '../utils/toast';

interface Props {
  onImportWords: (newWords: VocabItem[], book: CustomLexiconBook) => void;
  onDeleteBook?: (deletedBook: CustomLexiconBook) => void;
  onSelectBookForStudy?: (book: CustomLexiconBook) => void;
  totalVocabCount: number;
}

export const LexiconUploadCenter: React.FC<Props> = ({
  onImportWords,
  onDeleteBook,
  onSelectBookForStudy,
  totalVocabCount
}) => {
  // Official Preset Books (always available and up-to-date)
  const presetBooks = PRESET_CUSTOM_BOOKS.map(b => ({
    ...b,
    words: b.words ? b.words.map(sanitizeVocabItem) : []
  }));

  // Saved Custom User Books from LocalStorage
  const [customBooks, setCustomBooks] = useState<CustomLexiconBook[]>(() => {
    try {
      const saved = localStorage.getItem('korean_buddy_custom_lexicon');
      if (saved) {
        const parsed: CustomLexiconBook[] = JSON.parse(saved);
        // Exclude preset IDs so user books and preset books don't overlap
        const userUploaded = parsed.filter(b => !b.id.startsWith('preset_') && b.fileType !== 'preset');
        return userUploaded.map(b => ({
          ...b,
          words: b.words ? b.words.map(sanitizeVocabItem) : []
        }));
      }
    } catch (e) {
      console.error('Failed to load custom lexicon books', e);
    }
    return [];
  });

  const allBooks = [...presetBooks, ...customBooks];

  const [selectedBookId, setSelectedBookId] = useState<string>(() => {
    return presetBooks[0]?.id || 'preset_kpop_fandom';
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

  // Rename modal state
  const [editingBook, setEditingBook] = useState<{ id: string; title: string; category: string } | null>(null);

  // Real-time trending slang sync state
  const [isSyncingTrending, setIsSyncingTrending] = useState(false);

  const handleSyncTrendingSlang = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsSyncingTrending(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/curriculum/trending-slang');
      if (!res.ok) {
        throw new Error('网络请求热词失败');
      }
      const data = await res.json();
      const rawWords = data.words || [];
      if (!rawWords.length) {
        throw new Error('未获取到有效流行词汇');
      }

      const newVocabItems: VocabItem[] = rawWords.map((item: any, idx: number) => sanitizeVocabItem({
        id: `trend_live_${Date.now()}_${idx}`,
        word: item.word,
        hangul: item.word,
        hanja_or_root: item.origin || item.hanja_or_origin || '2025-2026 韩国实时网络热梗',
        type: item.pos || '신조어',
        meaning_zh: item.meaning_zh || item.definition_zh,
        meaning_en: '',
        category: '实时热词',
        level: 'Slang',
        source: '实时热词',
        origin: item.origin || item.hanja_or_origin || '',
        full_form: item.origin || item.hanja_or_origin || '',
        social_nuance: '韩国网络与同辈亲友高频流行语',
        example_kr: item.example_kr,
        example_zh: item.example_zh,
        mastered: 'new',
        isBookmarked: false,
      }));

      const trendingBook = presetBooks.find(b => b.id === 'preset_trending_slang') || {
        id: 'preset_trending_slang',
        title: '实时热词',
        description: '联网实时同步韩国 2024-2026 SNS 与 TikTok 流行热梗新词',
        fileName: 'trending_slang_live.json',
        fileType: 'preset' as const,
        totalWords: newVocabItems.length,
        importedAt: Date.now(),
        category: '实时热词',
        words: newVocabItems
      };

      onImportWords(newVocabItems, {
        ...trendingBook,
        words: [...trendingBook.words, ...newVocabItems],
        totalWords: trendingBook.words.length + newVocabItems.length
      });

      setSelectedBookId('preset_trending_slang');
      setSuccessBanner(`成功联网同步 ${newVocabItems.length} 个韩国当下最新热门流行语！`);
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
      notifyToast({
        type: 'success',
        title: '热词同步成功',
        message: `已成功联网更新 ${newVocabItems.length} 条韩国当下热梗`
      });
    } catch (err: any) {
      console.error('Failed to sync trending slang', err);
      setErrorMessage(formatApiErrorMessage(err) || '联网获取实时热词失败，请稍后重试');
    } finally {
      setIsSyncingTrending(false);
    }
  };

  // Preview, Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(50);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist user customBooks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('korean_buddy_custom_lexicon', JSON.stringify(customBooks));
    } catch (e) {
      console.warn('Failed to persist customBooks', e);
    }
  }, [customBooks]);

  const activeBook = allBooks.find(b => b.id === selectedBookId) || allBooks[0];

  // Reset page when active book or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBookId, searchQuery, pageSize]);

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
        setParseStatusText('正在解析 PDF 提取词条...');
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
        const text = await file.text();
        setParseProgress(60);
        parsedResult = parseRawTextLexicon(text, baseName, baseName);
      }

      setParseProgress(100);

      if (!parsedResult.words || parsedResult.words.length === 0) {
        setErrorMessage('未能从文件中解析出有效的韩语单词，请确认文件包含韩文字符。');
        setIsParsing(false);
        return;
      }

      const newBook: CustomLexiconBook = {
        id: `book_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: baseName.includes('延世') ? baseName : `《${baseName}》自定义词书`,
        description: `包含 ${parsedResult.words.length} 个词条`,
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

      setSuccessBanner(`成功导入《${newBook.title}》，共解析 ${parsedResult.words.length} 个词条。`);
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });

      setTimeout(() => setSuccessBanner(null), 5000);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMessage(`解析失败: ${err?.message || '请确认文件格式正确'}`);
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

      if (!res.ok) throw new Error('AI 扩充接口请求失败');
      const data: AISeedExpansionResult = await res.json();

      setLastExpansionResult(data);

      if (data.expandedItems && data.expandedItems.length > 0) {
        const updatedBook: CustomLexiconBook = {
          ...activeBook,
          totalWords: activeBook.totalWords + data.expandedItems.length,
          expandedCount: (activeBook.expandedCount || 0) + data.expandedItems.length,
          words: [...data.expandedItems, ...activeBook.words],
        };

        if (customBooks.some(b => b.id === activeBook.id)) {
          setCustomBooks(prev => prev.map(b => b.id === activeBook.id ? updatedBook : b));
        }
        onImportWords(data.expandedItems, updatedBook);
        setSuccessBanner(`已基于种子词扩充 ${data.expandedItems.length} 个实战词条与练习例句。`);
        notifyToast({
          type: 'success',
          title: '词书拓展完成',
          message: `已成功基于《${activeBook.title}》扩充 ${data.expandedItems.length} 个核心生词与实战例句。`
        });
        setTimeout(() => setSuccessBanner(null), 5000);
      }
    } catch (err: any) {
      console.error('AI expansion error:', err);
      const { title, message } = formatApiErrorMessage(err, '词书智能扩充');
      setErrorMessage(`AI 扩充失败: ${err?.message || '服务暂时不可用'}`);
      notifyToast({
        type: 'warning',
        title,
        message,
        duration: 5500
      });
    } finally {
      setIsExpanding(false);
    }
  };

  // Delete book handler
  const [bookToDelete, setBookToDelete] = useState<CustomLexiconBook | null>(null);

  const handleOpenDelete = (book: CustomLexiconBook, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookToDelete(book);
  };

  const handleConfirmDelete = () => {
    if (!bookToDelete) return;
    const bookId = bookToDelete.id;
    const bookTitle = bookToDelete.title || '该词书';
    
    // 1. Notify parent to completely remove words from global vocabulary state
    if (onDeleteBook) {
      onDeleteBook(bookToDelete);
    }

    // 2. Remove from customBooks state
    const filtered = customBooks.filter(b => b.id !== bookId);
    setCustomBooks(filtered);
    
    try {
      localStorage.setItem('korean_buddy_custom_lexicon', JSON.stringify(filtered));
    } catch (e) {
      console.warn('Failed to save lexicon to localStorage:', e);
    }

    if (selectedBookId === bookId) {
      setSelectedBookId(presetBooks[0]?.id || filtered[0]?.id || '');
    }

    setBookToDelete(null);
    setSuccessBanner(`已彻底删除词书《${bookTitle}》及其全部关联词条。`);
    notifyToast({
      type: 'info',
      title: '词书已删除',
      message: `已成功移除《${bookTitle}》及相关词汇。`
    });
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  // Start Rename book
  const handleOpenRename = (book: CustomLexiconBook, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBook({
      id: book.id,
      title: book.title,
      category: book.category || ''
    });
  };

  // Save Rename book
  const handleSaveRename = () => {
    if (!editingBook || !editingBook.title.trim()) return;
    setCustomBooks(prev => prev.map(b => {
      if (b.id === editingBook.id) {
        return {
          ...b,
          title: editingBook.title.trim(),
          category: editingBook.category.trim() || b.category
        };
      }
      return b;
    }));
    setEditingBook(null);
    setSuccessBanner('词书信息已更新');
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  // Batch sanitize / clean active book
  const handleBatchSanitizeActiveBook = () => {
    if (!activeBook) return;
    const cleanedWords = activeBook.words.map(sanitizeVocabItem);
    const updatedBook = { ...activeBook, words: cleanedWords };
    
    if (customBooks.some(b => b.id === activeBook.id)) {
      setCustomBooks(prev => prev.map(b => b.id === activeBook.id ? updatedBook : b));
    }
    setSuccessBanner(`已清洗规范《${activeBook.title}》所有词条释义与词性。`);
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  // Export active book as JSON
  const handleExportActiveBookJSON = () => {
    if (!activeBook) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeBook.words, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${activeBook.title.replace(/[《》]/g, '')}_words.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filtered & Paginated Words for Active Book
  const filteredWords = (activeBook?.words || []).filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (item.hangul || item.word || '').toLowerCase().includes(q) ||
      (item.meaning_zh || '').toLowerCase().includes(q) ||
      (item.origin || item.hanja_or_root || '').toLowerCase().includes(q) ||
      (item.type || '').toLowerCase().includes(q)
    );
  });

  const totalFiltered = filteredWords.length;
  const displayedWords = pageSize === 'all'
    ? filteredWords
    : filteredWords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalFiltered / pageSize));

  // Compute precise stats
  const presetTotalWords = presetBooks.reduce((sum, b) => sum + (b.totalWords || b.words.length), 0);
  const customTotalWords = customBooks.reduce((sum, b) => sum + (b.totalWords || b.words.length), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Title & Stats Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.06]">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers size={18} className="text-slate-700" />
            <span>词书库与自定义导入管理</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            官方内置 K-POP & 高频日常词库，支持扩展导入 .PDF / .JSON / .CSV / .TXT
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-black/[0.04] text-slate-700 font-mono flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-slate-900" />
            <span>内置 <strong className="text-slate-900">{presetBooks.length}</strong> 本 ({presetTotalWords} 词)</span>
          </div>
          {customBooks.length > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-black/[0.04] text-slate-700 font-mono">
              导入 <strong className="text-slate-900">{customBooks.length}</strong> 本 ({customTotalWords} 词)
            </div>
          )}
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-mono shadow-xs">
            总词库 <strong className="text-white">{totalVocabCount}</strong> 词
          </div>
        </div>
      </div>

      {/* Success & Error Banners */}
      {successBanner && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-slate-400 hover:text-white text-[11px]">
            关闭
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-800 text-[11px]">
            关闭
          </button>
        </div>
      )}

      {/* Part 1: Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-6 sm:p-8 rounded-2xl border border-dashed text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'bg-slate-100 border-slate-700 scale-[0.99]'
            : 'bg-white border-slate-200 hover:bg-slate-50/80 hover:border-slate-300 shadow-sm'
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
            <div className="flex items-center justify-center gap-2 text-slate-900 font-medium text-xs">
              <Loader2 size={15} className="animate-spin text-slate-700" />
              <span>{parseStatusText}</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-slate-900 h-full transition-all duration-300 rounded-full"
                style={{ width: `${parseProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              解析进度: {parseProgress}%
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-black/[0.04] mx-auto flex items-center justify-center text-slate-700">
              <Upload size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                点击或拖拽词书文件至此处上传
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                支持 .PDF、.JSON、.CSV 或 .TXT 格式
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-black/[0.04] text-[11px] text-slate-500 font-mono">
              <span>自动识别词性、释义、例句与生词难度</span>
            </div>
          </div>
        )}
      </div>

      {/* Part 2: Official Preset Lexicons (官方内置板块) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-slate-700" />
            <span>官方内置词书板块 ({presetBooks.length})</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            系统深度整理 · 全面收录
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {presetBooks.map(book => {
            const isSelected = book.id === selectedBookId;
            const isTrending = book.id.includes('trending') || book.id.includes('slang');
            const iconTag = book.id.includes('kpop') ? 'K-POP' : book.id.includes('daily') ? 'DAILY' : 'TREND';

            return (
              <div
                key={book.id}
                onClick={() => setSelectedBookId(book.id)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative shadow-sm flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-50/90 border-slate-900/40 ring-1 ring-slate-900/10'
                    : 'bg-white border-black/[0.04] hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 font-mono text-[10px] font-bold">
                        {iconTag}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-semibold text-xs text-slate-900 truncate">
                            {book.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          {book.totalWords} 词 {isTrending ? '· 实时连网' : '· 精选内置'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isSelected ? (
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-medium">
                          当前
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200/60">
                          {isTrending ? '实时' : '内置'}
                        </span>
                      )}
                    </div>
                  </div>

                  {book.description && (
                    <p className="text-[11px] text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">
                      {book.description}
                    </p>
                  )}
                </div>

                {isTrending && (
                  <div className="mt-3 pt-2.5 border-t border-black/[0.05] flex items-center justify-between">
                    <button
                      type="button"
                      disabled={isSyncingTrending}
                      onClick={handleSyncTrendingSlang}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200/90 text-slate-800 text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isSyncingTrending ? (
                        <>
                          <Loader2 size={12} className="animate-spin text-slate-700" />
                          <span>联网更新中...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={12} className="text-slate-700" />
                          <span>联网更新热词</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Part 3: User Custom Uploaded Books */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <FolderOpen size={14} className="text-slate-500" />
            <span>我的自定义导入词书 ({customBooks.length})</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            支持重命名、词库清洗与彻底删除
          </span>
        </div>

        {customBooks.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-50/60 border border-dashed border-slate-200 text-center space-y-1">
            <p className="text-xs text-slate-600 font-medium">暂无自定义上传词书</p>
            <p className="text-[11px] text-slate-400">
              上方拖拽或点击上传本地词汇文件，即可扩展专属词书与生词题库
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {customBooks.map(book => {
              const isSelected = book.id === selectedBookId;
              return (
                <div
                  key={book.id}
                  onClick={() => setSelectedBookId(book.id)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative shadow-sm ${
                    isSelected
                      ? 'bg-slate-50/90 border-slate-900/30 ring-1 ring-slate-900/10'
                      : 'bg-white border-black/[0.04] hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-black/[0.04] flex items-center justify-center shrink-0 text-slate-700 font-mono text-[11px] font-semibold">
                        {book.fileType?.slice(0, 3).toUpperCase() || 'DOC'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-xs text-slate-900 truncate">
                          {book.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {book.totalWords} 词 {book.expandedCount ? `(+${book.expandedCount} 扩充)` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-medium">
                          当前
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleOpenRename(book, e)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
                        title="重命名词书"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleOpenDelete(book, e)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="彻底删除词书与对应词汇"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {book.description && (
                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-1 leading-relaxed">
                      {book.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Book Confirmation Modal */}
      {bookToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl border border-black/[0.06] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 size={18} />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-slate-900 truncate">彻底删除词书</h4>
                <p className="text-xs text-slate-500 mt-0.5">将同步清理全局词库中的对应生词</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-black/[0.04]">
              确定要从本地词库中彻底移除《<span className="font-semibold text-slate-900">{bookToDelete.title}</span>》（包含 {bookToDelete.totalWords} 个词条）吗？
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setBookToDelete(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors"
              >
                确认彻底删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Book Modal */}
      {editingBook && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-lg border border-black/[0.06] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">重命名词书</h4>
              <button
                onClick={() => setEditingBook(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={15} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  词书名称
                </label>
                <input
                  type="text"
                  value={editingBook.title}
                  onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800"
                  placeholder="请输入词书标题..."
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  分类标签
                </label>
                <input
                  type="text"
                  value={editingBook.category}
                  onChange={(e) => setEditingBook({ ...editingBook, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800"
                  placeholder="如：延世韩语、初级词汇..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingBook(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveRename}
                className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 text-white hover:bg-black rounded-lg transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Part 4: Active Book Details & Words Table */}
      {activeBook && (
        <div className="p-5 rounded-2xl bg-white border border-black/[0.04] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{activeBook.title}</h3>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono">
                  {activeBook.category || '自定义'}
                </span>
                {activeBook.id.startsWith('preset_') && (
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-medium">
                    官方内置
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                包含 {activeBook.words.length} 个词汇条目
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {onSelectBookForStudy && (
                <button
                  onClick={() => onSelectBookForStudy(activeBook)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <BookOpen size={13} />
                  <span>以此词书开启研习</span>
                </button>
              )}

              <button
                onClick={handleBatchSanitizeActiveBook}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                title="清除杂质数字、规范分离中英文释义"
              >
                <RefreshCw size={13} className="text-slate-600" />
                <span>一键清洗规范释义</span>
              </button>

              <button
                onClick={handleTriggerAIExpansion}
                disabled={isExpanding}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
              >
                {isExpanding ? (
                  <>
                    <Loader2 size={13} className="animate-spin text-slate-700" />
                    <span>AI 拓展题库中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} className="text-slate-700" />
                    <span>AI 拓展新例句/题库</span>
                  </>
                )}
              </button>

              <button
                onClick={handleExportActiveBookJSON}
                className="p-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors shadow-sm"
                title="导出词书 JSON"
              >
                <Download size={14} />
              </button>
            </div>
          </div>

          {/* AI Seed Expansion Feedback Banner */}
          {lastExpansionResult && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-black/[0.04] space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-900">
                <span className="flex items-center gap-1.5">
                  <Zap size={13} className="text-slate-700" />
                  <span>拓展成果：已生成 {lastExpansionResult.expandedItems.length} 个实战词条与例句</span>
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                {lastExpansionResult.expandedItems.map(item => (
                  <span key={item.id} className="px-2.5 py-1 rounded-lg bg-white border border-black/[0.04] text-slate-800 text-[11px] shrink-0">
                    <strong className="font-semibold">{item.hangul}</strong>: {item.meaning_zh}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Words Preview Table & Quick Search */}
          <div className="space-y-3 pt-2 border-t border-black/[0.04]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-800">
                  词条列表 ({totalFiltered} 词)
                </span>
                <span className="text-[11px] text-slate-400">
                  可快速检索韩语单词、词性与释义
                </span>
              </div>

              {/* Search bar & Page size selector */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索词条、释义..."
                    className="pl-7 pr-3 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 w-44"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>

                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-slate-800"
                >
                  <option value={20}>20 词/页</option>
                  <option value={50}>50 词/页</option>
                  <option value={100}>100 词/页</option>
                  <option value="all">全部显示</option>
                </select>
              </div>
            </div>

            {/* Word Items Table */}
            <div className="overflow-x-auto rounded-xl border border-black/[0.04]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-black/[0.04] text-slate-500 font-medium">
                    <th className="py-2.5 px-3 w-12 text-center font-mono">#</th>
                    <th className="py-2.5 px-3">韩文单词</th>
                    <th className="py-2.5 px-3 w-20">词性</th>
                    <th className="py-2.5 px-3">汉字词/溯源</th>
                    <th className="py-2.5 px-3">中文释义</th>
                    <th className="py-2.5 px-3">实战例句</th>
                    <th className="py-2.5 px-3 w-12 text-center">发音</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.03]">
                  {displayedWords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        未找到匹配词条
                      </td>
                    </tr>
                  ) : (
                    displayedWords.map((item, idx) => {
                      const displayIdx = pageSize === 'all' ? idx + 1 : (currentPage - 1) * (pageSize as number) + idx + 1;
                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                            {displayIdx}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 font-sans-kr">
                            {item.hangul || item.word}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">
                              {item.type || '단어'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px] font-mono">
                            {item.origin || item.hanja_or_root || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-800">
                            {item.meaning_zh || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-xs truncate" title={`${item.example_kr || ''} ${item.example_zh || ''}`}>
                            {item.example_kr ? `${item.example_kr} (${item.example_zh || ''})` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => speakKorean(item.hangul || item.word)}
                              className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                              title="播放发音"
                            >
                              <Volume2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pageSize !== 'all' && totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400 font-mono">
                  第 {currentPage} / {totalPages} 页 (共 {totalFiltered} 词)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="px-2 text-xs font-mono text-slate-700">
                    {currentPage}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
