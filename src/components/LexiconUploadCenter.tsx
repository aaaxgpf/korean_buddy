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
  ChevronRight
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
        const parsed: CustomLexiconBook[] = JSON.parse(saved);
        return parsed.map(b => ({
          ...b,
          words: b.words ? b.words.map(sanitizeVocabItem) : []
        }));
      }
    } catch (e) {
      console.error('Failed to load custom lexicon books', e);
    }
    return PRESET_CUSTOM_BOOKS.map(b => ({
      ...b,
      words: b.words ? b.words.map(sanitizeVocabItem) : []
    }));
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

  // Rename modal state
  const [editingBook, setEditingBook] = useState<{ id: string; title: string; category: string } | null>(null);

  // Preview, Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(50);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist customBooks to localStorage
  useEffect(() => {
    localStorage.setItem('korean_buddy_custom_lexicon', JSON.stringify(customBooks));
  }, [customBooks]);

  const activeBook = customBooks.find(b => b.id === selectedBookId) || customBooks[0];

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

        setCustomBooks(prev => prev.map(b => b.id === activeBook.id ? updatedBook : b));
        onImportWords(data.expandedItems, updatedBook);
        setSuccessBanner(`已基于种子词扩充 ${data.expandedItems.length} 个实战词条与练习例句。`);
        notifyToast({
          type: 'success',
          title: '✨ 词书拓展完成',
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
    const filtered = customBooks.filter(b => b.id !== bookId);
    setCustomBooks(filtered);
    try {
      localStorage.setItem('korean_buddy_custom_lexicon', JSON.stringify(filtered));
    } catch (e) {
      console.warn('Failed to save lexicon to localStorage:', e);
    }
    if (selectedBookId === bookId) {
      setSelectedBookId(filtered[0]?.id || '');
    }
    setBookToDelete(null);
    setSuccessBanner(`已彻底删除词书《${bookTitle}》`);
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
    const updatedBook: CustomLexiconBook = {
      ...activeBook,
      words: cleanedWords,
      updatedAt: Date.now()
    };
    const updatedBooks = customBooks.map(b => b.id === activeBook.id ? updatedBook : b);
    setCustomBooks(updatedBooks);
    try {
      localStorage.setItem('korean_buddy_custom_lexicon', JSON.stringify(updatedBooks));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
    setSuccessBanner('词书释义已全量规范清洗！多余数字已清除，中英文释义已精准分离。');
    notifyToast({
      type: 'success',
      title: '✨ 词条清洗完成',
      message: `已为《${activeBook.title}》清洗 ${cleanedWords.length} 个词条，分离中英文并清除杂质数字。`
    });
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  // Word edit state & handlers
  const [editingWord, setEditingWord] = useState<VocabItem | null>(null);

  const handleSaveWordEdit = () => {
    if (!editingWord || !activeBook) return;
    const cleaned = sanitizeVocabItem(editingWord);
    const updatedWords = activeBook.words.map(w => w.id === cleaned.id ? cleaned : w);
    const updatedBook: CustomLexiconBook = {
      ...activeBook,
      words: updatedWords,
      updatedAt: Date.now()
    };
    const updatedBooks = customBooks.map(b => b.id === activeBook.id ? updatedBook : b);
    setCustomBooks(updatedBooks);
    try {
      localStorage.setItem('korean_buddy_custom_lexicon', JSON.stringify(updatedBooks));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
    setEditingWord(null);
    notifyToast({
      type: 'success',
      title: '词条已更新',
      message: `已成功修改词汇 “${cleaned.hangul}” 的释义与例句。`
    });
  };

  // Filter words in preview
  const filteredWords = (activeBook?.words || []).filter(w => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (w.hangul && w.hangul.toLowerCase().includes(q)) ||
      (w.word && w.word.toLowerCase().includes(q)) ||
      (w.meaning_zh && w.meaning_zh.toLowerCase().includes(q)) ||
      (w.meaning_en && w.meaning_en.toLowerCase().includes(q)) ||
      (w.hanja_or_root && w.hanja_or_root.toLowerCase().includes(q))
    );
  });

  const totalFiltered = filteredWords.length;
  const displayedWords = pageSize === 'all'
    ? filteredWords
    : filteredWords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalFiltered / pageSize));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Title & Stats Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.06]">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers size={18} className="text-slate-700" />
            <span>自定义词书与管理中心</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            支持 PDF / JSON / CSV / TXT 格式导入，数据本地持久化存储
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-black/[0.04] text-slate-700 font-mono">
            已导入 <span className="text-slate-900 font-semibold">{customBooks.length}</span> 本词书
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-black/[0.04] text-slate-700 font-mono">
            总词库 <span className="text-slate-900 font-semibold">{totalVocabCount}</span> 词
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
              <span>自动识别词性、释义与例句</span>
            </div>
          </div>
        )}
      </div>

      {/* Part 2: Lexicon Books List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            词书列表 ({customBooks.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            存储于本地浏览器缓存
          </span>
        </div>

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
                    <div className="w-7 h-7 rounded-lg bg-slate-100 border border-black/[0.04] flex items-center justify-center shrink-0 text-slate-700 font-mono text-[11px] font-semibold">
                      {book.fileType.slice(0, 3).toUpperCase()}
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
                      title="彻底删除词书"
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
                <p className="text-xs text-slate-500 mt-0.5">此操作不可撤销</p>
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
                确认删除
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

      {/* Part 3: Active Book Details & Words Table */}
      {activeBook && (
        <div className="p-5 rounded-2xl bg-white border border-black/[0.04] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{activeBook.title}</h3>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono">
                  {activeBook.category || '自定义'}
                </span>
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
                  第 {currentPage} / {totalPages} 页
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-44 sm:w-56">
                  <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索词汇、中文或英文释义..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-black/[0.04] rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 transition-all"
                  />
                </div>

                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="px-2 py-1.5 bg-slate-50 border border-black/[0.04] rounded-lg text-xs text-slate-700 focus:outline-none focus:bg-white"
                >
                  <option value={50}>每页 50 词</option>
                  <option value={100}>每页 100 词</option>
                  <option value="all">显示全部</option>
                </select>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white relative">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-200 shadow-xs">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold text-[11px] whitespace-nowrap">韩语 (Hangul)</th>
                    <th className="py-2.5 px-3 font-semibold text-[11px] whitespace-nowrap">词性 / 汉字</th>
                    <th className="py-2.5 px-3 font-semibold text-[11px]">中文释义</th>
                    <th className="py-2.5 px-3 font-semibold text-[11px]">英文释义</th>
                    <th className="py-2.5 px-3 font-semibold text-[11px]">实战例句</th>
                    <th className="py-2.5 px-3 text-right font-semibold text-[11px] whitespace-nowrap">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {displayedWords.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-900">{item.hangul || item.word}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                        <span>{item.type}</span>
                        {item.hanja_or_root && (
                          <span className="ml-1 text-slate-400 font-serif">({item.hanja_or_root})</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium">{item.meaning_zh}</td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] font-sans">
                        {item.meaning_en ? (
                          <span className="text-slate-600">{item.meaning_en}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-xs truncate" title={`${item.example_kr || ''} ${item.example_zh || ''}`}>
                        {item.example_kr || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => speakKorean(item.hangul || item.word)}
                            className="p-1 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="朗读发音"
                          >
                            <Volume2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingWord(item)}
                            className="p-1 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="编辑词条"
                          >
                            <Edit3 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {displayedWords.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  未找到匹配的词汇条目
                </div>
              )}
            </div>

            {/* Pagination controls */}
            {pageSize !== 'all' && totalPages > 1 && (
              <div className="flex items-center justify-between pt-1 text-xs text-slate-600">
                <span>
                  显示 {(currentPage - 1) * (typeof pageSize === 'number' ? pageSize : 50) + 1} - {Math.min(currentPage * (typeof pageSize === 'number' ? pageSize : 50), totalFiltered)} 条 / 共 {totalFiltered} 条
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="px-2 font-mono text-[11px]">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Single Word Modal */}
      {editingWord && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-xl border border-black/[0.06] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">编辑词条信息</h4>
                <p className="text-[11px] text-slate-400">精确修正中英文释义与例句</p>
              </div>
              <button
                onClick={() => setEditingWord(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={15} />
              </button>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    韩语单词 (Hangul)
                  </label>
                  <input
                    type="text"
                    value={editingWord.hangul || editingWord.word}
                    onChange={(e) => setEditingWord({ ...editingWord, hangul: e.target.value, word: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    词性 (POS)
                  </label>
                  <input
                    type="text"
                    value={editingWord.type || ''}
                    onChange={(e) => setEditingWord({ ...editingWord, type: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-slate-800"
                    placeholder="如：명사 (名词)"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  中文释义 (Chinese)
                </label>
                <input
                  type="text"
                  value={editingWord.meaning_zh || ''}
                  onChange={(e) => setEditingWord({ ...editingWord, meaning_zh: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-slate-800"
                  placeholder="如：家务，家事"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  英文释义 (English)
                </label>
                <input
                  type="text"
                  value={editingWord.meaning_en || ''}
                  onChange={(e) => setEditingWord({ ...editingWord, meaning_en: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-slate-800"
                  placeholder="如：housework, domestic chores"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  韩语例句
                </label>
                <textarea
                  rows={2}
                  value={editingWord.example_kr || ''}
                  onChange={(e) => setEditingWord({ ...editingWord, example_kr: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-slate-800 resize-none"
                  placeholder="韩语例句..."
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  例句翻译
                </label>
                <input
                  type="text"
                  value={editingWord.example_zh || ''}
                  onChange={(e) => setEditingWord({ ...editingWord, example_zh: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-slate-800"
                  placeholder="中文例句翻译..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingWord(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveWordEdit}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white hover:bg-black rounded-lg transition-colors shadow-sm"
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
