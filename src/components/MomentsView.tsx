import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  MessageSquare, 
  RefreshCw, 
  Volume2, 
  Plus, 
  Send, 
  Check, 
  Copy, 
  Sparkles, 
  X, 
  Bookmark, 
  Languages, 
  CheckCircle2, 
  FileText,
  Search,
  Share2,
  Image as ImageIcon,
  MoreHorizontal
} from 'lucide-react';
import { MomentPost, MomentComment, Companion, VocabItem, UserProfile } from '../types';
import { INITIAL_MOMENT_POSTS } from '../data/momentsData';
import { IDOL_PHOTO_AVATARS } from '../data/companions';
import { speakKorean } from '../utils/audio';
import { showSuccessToast, showErrorToast } from '../utils/toast';

interface Props {
  companions: Companion[];
  selectedCompanion?: Companion;
  userProfile: UserProfile;
  languageMode?: string;
  recentMessages?: any[];
  onSaveVocab: (vocab: any) => void;
  savedVocabIds: Set<string>;
}

// Category filter tabs
const FEED_TABS = [
  { id: 'all', label: '全部动态' },
  { id: 'the_boyz', label: 'THE BOYZ' },
  { id: 'riize', label: 'RIIZE' },
  { id: 'tws', label: 'TWS' },
  { id: 'my_posts', label: '我的贴文' }
];

export const MomentsView: React.FC<Props> = ({
  companions,
  selectedCompanion,
  userProfile,
  recentMessages = [],
  onSaveVocab,
  savedVocabIds
}) => {
  // Load posts from localStorage or initial dataset
  const [posts, setPosts] = useState<MomentPost[]>(() => {
    try {
      const saved = localStorage.getItem('korean_buddy_feed_v6');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 30).map((p: any) => ({
            ...p,
            authorAvatar: IDOL_PHOTO_AVATARS[p.authorId] || p.authorAvatar,
            comments: Array.isArray(p.comments) ? p.comments.map((c: any) => ({
              ...c,
              authorAvatar: IDOL_PHOTO_AVATARS[c.authorId] || c.authorAvatar
            })) : []
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to load feed from localStorage', e);
    }
    return INITIAL_MOMENT_POSTS;
  });

  // Active filter tab
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Translation display toggle map (postId -> boolean)
  const [showTranslations, setShowTranslations] = useState<Record<string, boolean>>({});
  
  // Comment section toggle map (postId -> boolean)
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  
  // Comment input per post
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  
  // Refresh loading state
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Audio playing indicator
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Vocabulary detail modal
  const [selectedVocabDetail, setSelectedVocabDetail] = useState<VocabItem | null>(null);

  // Lightbox image preview modal
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Quick Post Composer State
  const [composerText, setComposerText] = useState<string>('');
  const [isComposerFocused, setIsComposerFocused] = useState<boolean>(false);
  const [isPolishing, setIsPolishing] = useState<boolean>(false);

  // Persist posts
  useEffect(() => {
    try {
      localStorage.setItem('korean_buddy_feed_v6', JSON.stringify(posts));
    } catch (e) {
      console.warn('Failed to persist feed', e);
    }
  }, [posts]);

  // Handle Like
  const handleToggleLike = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const nextIsLiked = !p.isLiked;
        return {
          ...p,
          isLiked: nextIsLiked,
          likes: nextIsLiked ? p.likes + 1 : Math.max(0, p.likes - 1)
        };
      }
      return p;
    }));
  };

  // Toggle Translation
  const toggleTranslation = (postId: string) => {
    setShowTranslations(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Toggle Comments
  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // TTS Speech
  const handlePlayAudio = (postId: string, text: string) => {
    setPlayingAudioId(postId);
    speakKorean(text);
    setTimeout(() => {
      setPlayingAudioId(null);
    }, 2800);
  };

  // Copy Text
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showSuccessToast('已复制到剪贴板', `${label}已复制。`);
  };

  // Add Comment
  const handleAddComment = (postId: string) => {
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;

    const newComment: MomentComment = {
      id: `comment_${Date.now()}`,
      authorId: 'user',
      authorName: userProfile.userName || userProfile.name || '나',
      authorAvatar: userProfile.avatarUrl || '/sunwoo.jpg',
      isIdol: false,
      korean: text,
      translation_zh: text,
      timestamp: Date.now()
    };

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, newComment]
        };
      }
      return p;
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    setExpandedComments(prev => ({ ...prev, [postId]: true }));
    showSuccessToast('评论已发送', '已成功发布评论。');

    // Simulate Idol Reply
    setTimeout(() => {
      const targetPost = posts.find(p => p.id === postId);
      const authorComp = companions.find(c => c.id === targetPost?.authorId);
      const isIdolAuthor = authorComp?.group ? true : (targetPost?.isIdol ?? true);

      const replySamples = [
        { kr: '댓글 남겨줘서 고마워요. 오늘도 좋은 하루 보내요.', zh: '谢谢你的评论留言，今天也要度过美好的一天哦。' },
        { kr: '생각해보니까 다음엔 꼭 그렇게 해봐야겠네요.', zh: '想了想之后下次一定要试试那样做。' },
        { kr: '오늘 하루도 잘 버텨줘서 고마워요.', zh: '感谢今天也好好坚持下来的你。' },
        { kr: '공감! 저도 완전 그렇게 생각했어요.', zh: '同感！我也完全是这么想的。' },
        { kr: '댓글 보니까 기분 좋아지네요.', zh: '看到评论后心情变得很棒呢。' }
      ];

      const chosenReply = replySamples[Math.floor(Math.random() * replySamples.length)];
      const replyAuthorId = targetPost?.authorId || 'sunwoo';
      const autoReplyComment: MomentComment = {
        id: `comment_reply_${Date.now()}`,
        authorId: replyAuthorId,
        authorName: authorComp?.name_ko || targetPost?.authorName || '작성자',
        authorAvatar: IDOL_PHOTO_AVATARS[replyAuthorId] || authorComp?.avatar || targetPost?.authorAvatar || '/sunwoo.jpg',
        isIdol: isIdolAuthor,
        korean: chosenReply.kr,
        translation_zh: chosenReply.zh,
        timestamp: Date.now()
      };

      setPosts(curr => curr.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [...p.comments, autoReplyComment]
          };
        }
        return p;
      }));
    }, 1200);
  };

  // AI Polish user post
  const handleAIPolishComposer = async () => {
    if (!composerText.trim()) {
      showErrorToast('请输入内容', '请先输入需要润色的韩语或中文内容。');
      return;
    }

    setIsPolishing(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: composerText,
          targetLang: 'ko_bubble'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.translation) {
          setComposerText(data.translation);
          showSuccessToast('AI 润色完成', '已优化为地道自然的韩语生活口语表达。');
          return;
        }
      }
      showSuccessToast('AI 润色完成', '韩语句式整理完成。');
    } catch (e) {
      console.error(e);
    } finally {
      setIsPolishing(false);
    }
  };

  // Publish Post from Composer
  const handlePublishPost = () => {
    const text = composerText.trim();
    if (!text) {
      showErrorToast('内容不能为空', '请填写贴文内容。');
      return;
    }

    const newPost: MomentPost = {
      id: `post_user_${Date.now()}`,
      authorId: 'user',
      authorName: userProfile.userName || userProfile.name || '나',
      authorRemark: 'MY POST',
      authorAvatar: userProfile.avatarUrl || '/sunwoo.jpg',
      isIdol: false,
      group: 'MY POSTS',
      content_kr: text,
      content_zh: text,
      content_en: 'User generated community post.',
      likes: 1,
      isLiked: true,
      timestamp: Date.now(),
      vocabulary: [],
      comments: []
    };

    setPosts(prev => [newPost, ...prev]);
    setComposerText('');
    setIsComposerFocused(false);
    showSuccessToast('贴文发布成功', '已同步至广场动态流。');

    // Auto interaction from idol buddy
    setTimeout(() => {
      const luckyCompanion = companions[Math.floor(Math.random() * companions.length)] || companions[0];
      const idolComments = [
        { kr: '오늘 하루 진짜 알차게 보냈네요. 멋져요!', zh: '今天一天真的过得好充实啊，很棒！' },
        { kr: '이거 보니까 저도 힘내야겠네요. 오늘도 고생 많았어요.', zh: '看到这个我也要加油了，今天辛苦了。' },
        { kr: '한국어로 글 쓰는 거 대단해요. 파이팅!', zh: '用韩语发帖很厉害，加油！' }
      ];
      const commentChoice = idolComments[Math.floor(Math.random() * idolComments.length)];
      const autoIdolComment: MomentComment = {
        id: `c_idol_reply_${Date.now()}`,
        authorId: luckyCompanion?.id || 'sunwoo',
        authorName: luckyCompanion?.name_ko || luckyCompanion?.name_kr || '아이돌',
        authorAvatar: IDOL_PHOTO_AVATARS[luckyCompanion?.id || 'sunwoo'] || luckyCompanion?.avatar || '/sunwoo.jpg',
        isIdol: true,
        korean: commentChoice.kr,
        translation_zh: commentChoice.zh,
        timestamp: Date.now()
      };

      setPosts(curr => curr.map(p => {
        if (p.id === newPost.id) {
          return {
            ...p,
            likes: p.likes + 1,
            comments: [...p.comments, autoIdolComment]
          };
        }
        return p;
      }));
    }, 1800);
  };

  // Refresh Feed with AI Generation grounded in chat & persona settings
  const handleRefreshFeed = async (forceAIGenerate: boolean = true) => {
    setIsRefreshing(true);
    try {
      // 1. Retrieve any custom LLM config from localStorage
      let apiConfig: any = undefined;
      try {
        const savedCustomLLM = localStorage.getItem('korean_custom_llm_config');
        if (savedCustomLLM) {
          apiConfig = JSON.parse(savedCustomLLM);
        }
      } catch (_) {}

      // 2. Call server endpoint /api/moments/generate
      const response = await fetch('/api/moments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recentMessages: recentMessages || [],
          userProfile: {
            ...userProfile,
            notes: userProfile?.notes || (selectedCompanion as any)?.customNotes || ''
          },
          selectedCompanion,
          companions,
          apiConfig
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.posts && Array.isArray(data.posts) && data.posts.length > 0) {
          const formattedPosts: MomentPost[] = data.posts.map((p: any) => ({
            ...p,
            authorAvatar: IDOL_PHOTO_AVATARS[p.authorId] || p.authorAvatar || '/sunwoo.jpg',
            comments: Array.isArray(p.comments) ? p.comments.map((c: any) => ({
              ...c,
              authorAvatar: IDOL_PHOTO_AVATARS[c.authorId] || c.authorAvatar || '/sunwoo.jpg'
            })) : []
          }));

          // Prepend newly generated posts at the top, avoiding duplicate IDs
          setPosts(prev => {
            const existingIds = new Set(formattedPosts.map(p => p.id));
            const merged = [...formattedPosts, ...prev.filter(p => !existingIds.has(p.id))];
            return merged.slice(0, 35);
          });

          showSuccessToast('动态流已根据对话生成', '已结合近期对话话题与专属人设生成沉浸式爱豆动态。');
          return;
        }
      }

      // Fallback if network or server generation failed
      showSuccessToast('动态已刷新', '已更新广场最新贴文。');
    } catch (e: any) {
      console.warn('Feed generation error:', e);
      showErrorToast('刷新失败', '请检查网络或大模型 API 配置。');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter Posts
  const displayedPosts = posts.filter(p => {
    if (activeFilter === 'the_boyz' && p.group !== 'THE BOYZ') return false;
    if (activeFilter === 'riize' && p.group !== 'RIIZE') return false;
    if (activeFilter === 'tws' && p.group !== 'TWS') return false;
    if (activeFilter === 'my_posts' && p.authorId !== 'user') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        p.content_kr.toLowerCase().includes(q) ||
        (p.content_zh && p.content_zh.toLowerCase().includes(q)) ||
        p.authorName.toLowerCase().includes(q) ||
        (p.group && p.group.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const formatPostTime = (ts: number) => {
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / (3600000 * 24));

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="w-full h-full bg-[#FAF9F6] flex flex-col overflow-hidden">
      
      {/* Scrollable Feed Container */}
      <div className="flex-1 overflow-y-auto min-h-0 select-text">
        <div className="max-w-2xl mx-auto w-full min-h-full bg-white border-x border-stone-200/80 shadow-xs flex flex-col pb-36">
          
          {/* Top Sticky Header */}
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-stone-900 tracking-tight">
                广场动态
              </h1>
              <span className="text-xs text-stone-400 font-mono">
                {displayedPosts.length} 篇贴文
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Search Bar */}
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索动态、生词..."
                  className="pl-7 pr-3 py-1 text-xs border border-stone-200 rounded-full focus:outline-none focus:border-stone-900 w-36 sm:w-48 bg-stone-50/60"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>

              {/* Clean Minimalist Refresh Button */}
              <button
                type="button"
                onClick={() => handleRefreshFeed(true)}
                disabled={isRefreshing}
                className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors disabled:opacity-40 cursor-pointer"
                title="刷新广场动态"
              >
                <RefreshCw size={15} className={isRefreshing ? "animate-spin text-stone-900" : ""} />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="border-b border-stone-100 px-4 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-stone-50/50">
            {FEED_TABS.map(tab => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                    isActive 
                      ? 'bg-stone-900 text-white shadow-2xs' 
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 bg-white border border-stone-200/70'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Social Post Compose Box (Twitter/Threads style) */}
          <div className="p-4 border-b border-stone-200 bg-white">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                {userProfile.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt="User" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-xs text-stone-600">
                    {userProfile.name ? userProfile.name.slice(0, 1) : '나'}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <textarea
                  rows={isComposerFocused ? 3 : 2}
                  value={composerText}
                  onFocus={() => setIsComposerFocused(true)}
                  onChange={(e) => setComposerText(e.target.value)}
                  placeholder="分享韩语学习日常或输入中文，支持 AI 一键润色为地道韩语..."
                  className="w-full text-sm placeholder:text-stone-400 text-stone-900 bg-transparent resize-none focus:outline-none leading-relaxed"
                />

                <div className="flex items-center justify-between pt-2 border-t border-stone-100 mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAIPolishComposer}
                      disabled={isPolishing || !composerText.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition disabled:opacity-40"
                    >
                      <Sparkles size={13} className={isPolishing ? "animate-spin text-stone-900" : "text-stone-600"} />
                      <span>{isPolishing ? 'AI 润色中...' : 'AI 润色为地道韩语'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {isComposerFocused && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsComposerFocused(false);
                          setComposerText('');
                        }}
                        className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800 transition font-medium"
                      >
                        取消
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handlePublishPost}
                      disabled={!composerText.trim()}
                      className="px-4 py-1.5 bg-stone-900 hover:bg-black text-white rounded-full text-xs font-semibold transition disabled:opacity-30 shadow-2xs"
                    >
                      发布贴文
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Timeline Stream */}
          <div className="divide-y divide-stone-100 flex-1">
            {displayedPosts.length === 0 ? (
              <div className="text-center py-20 px-4">
                <FileText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-stone-700">暂无相关贴文</p>
                <p className="text-xs text-stone-400 mt-1">
                  {searchQuery ? '未找到符合搜索条件的贴文' : '点击上方输入框发布第一条贴文吧'}
                </p>
              </div>
            ) : (
              displayedPosts.map((post) => {
                const isTransOpen = showTranslations[post.id];
                const isCommentsOpen = expandedComments[post.id];
                const realAuthorAvatar = post.authorId === 'user' 
                  ? (userProfile.avatarUrl || '/sunwoo.jpg')
                  : (IDOL_PHOTO_AVATARS[post.authorId] || companions.find(c => c.id === post.authorId)?.avatar || post.authorAvatar || '/sunwoo.jpg');
                
                const isPlayingAudio = playingAudioId === post.id;

                return (
                  <article 
                    key={post.id}
                    className="p-4 sm:p-5 hover:bg-stone-50/40 transition-colors space-y-3"
                  >
                    {/* Author Info Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={realAuthorAvatar} 
                          alt={post.authorName} 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = IDOL_PHOTO_AVATARS[post.authorId] || '/sunwoo.jpg';
                          }}
                          className="w-10 h-10 rounded-full object-cover border border-stone-200/90 shrink-0"
                        />

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-sm text-stone-900">
                              {post.authorName}
                            </span>
                            {post.group && (
                              <span className="text-[10px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200/60 font-mono">
                                {post.group}
                              </span>
                            )}
                            {post.authorId === 'user' && (
                              <span className="text-[10px] font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full">
                                我的贴文
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                            {formatPostTime(post.timestamp)}
                          </div>
                        </div>
                      </div>

                      {/* Top Right Action Menu */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(post.id, post.content_kr)}
                          className={`p-1.5 rounded-full transition-colors ${
                            isPlayingAudio 
                              ? 'bg-stone-900 text-white' 
                              : 'text-stone-400 hover:text-stone-800 hover:bg-stone-100'
                          }`}
                          title="播放韩语音频"
                        >
                          <Volume2 size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyText(post.content_kr, '贴文原句')}
                          className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-full transition-colors"
                          title="复制韩文原句"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Korean Post Body Typography */}
                    <div className="text-[15px] text-stone-900 leading-relaxed select-text font-normal">
                      {post.content_kr}
                    </div>

                    {/* Attached Photo */}
                    {post.imageUrls && post.imageUrls.length > 0 && (
                      <div 
                        onClick={() => setLightboxImage(post.imageUrls![0])}
                        className="relative rounded-xl overflow-hidden border border-stone-200 cursor-pointer max-h-80 bg-stone-100"
                      >
                        <img 
                          src={post.imageUrls[0]} 
                          alt="Post attachment" 
                          referrerPolicy="no-referrer" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Clean Inline Vocabulary Badges */}
                    {post.vocabulary && post.vocabulary.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {post.vocabulary.map((v) => {
                          const isSaved = savedVocabIds.has(v.id);
                          return (
                            <div
                              key={v.id}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                                isSaved 
                                  ? 'bg-stone-100 text-stone-900 border-stone-300 font-medium' 
                                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => setSelectedVocabDetail(v)}
                                className="cursor-pointer text-left flex items-baseline gap-1"
                              >
                                <span className="font-semibold text-stone-900">{v.hangul || v.word}</span>
                                <span className="text-stone-500 text-[11px] font-normal">{v.meaning_zh}</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSaveVocab(v);
                                  showSuccessToast(isSaved ? '生词本已有' : '已添加至生词本', `${v.hangul || v.word}: ${v.meaning_zh}`);
                                }}
                                className="text-stone-400 hover:text-stone-900 cursor-pointer pl-0.5"
                                title={isSaved ? "已保存" : "加入生词本"}
                              >
                                {isSaved ? (
                                  <Check size={12} className="text-stone-900 font-bold" />
                                ) : (
                                  <Plus size={12} />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Translation Box (Clean Subtitle style) */}
                    {isTransOpen && (
                      <div className="p-3 bg-stone-50 rounded-xl text-xs text-stone-700 border-l-2 border-stone-800 space-y-1">
                        <p className="font-medium text-stone-900 leading-relaxed">{post.content_zh}</p>
                        {post.content_en && <p className="text-stone-500 text-[11px] font-sans">{post.content_en}</p>}
                      </div>
                    )}

                    {/* Feed Action Bar */}
                    <div className="flex items-center justify-between pt-1 text-xs text-stone-500">
                      <div className="flex items-center gap-5">
                        {/* Like */}
                        <button
                          type="button"
                          onClick={() => handleToggleLike(post.id)}
                          className={`flex items-center gap-1.5 transition-colors ${
                            post.isLiked ? 'text-rose-600 font-semibold' : 'text-stone-500 hover:text-stone-900'
                          }`}
                        >
                          <Heart size={15} className={post.isLiked ? 'fill-rose-600' : ''} />
                          <span>{post.likes}</span>
                        </button>

                        {/* Comments Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleComments(post.id)}
                          className="flex items-center gap-1.5 text-stone-500 hover:text-stone-900 transition-colors"
                        >
                          <MessageSquare size={15} />
                          <span>{post.comments.length}</span>
                        </button>
                      </div>

                      {/* Translation Switch Button */}
                      <button
                        type="button"
                        onClick={() => toggleTranslation(post.id)}
                        className="flex items-center gap-1 text-stone-500 hover:text-stone-900 transition-colors font-medium text-[11px]"
                      >
                        <Languages size={13} />
                        <span>{isTransOpen ? '收起译文' : '查看中文释义'}</span>
                      </button>
                    </div>

                    {/* Threaded Comments Drawer */}
                    {isCommentsOpen && (
                      <div className="pt-2 border-t border-stone-100 space-y-2.5">
                        {/* Existing Comments */}
                        {post.comments.length > 0 && (
                          <div className="space-y-2 bg-stone-50/90 p-3 rounded-xl">
                            {post.comments.map((c) => {
                              const cAvatar = IDOL_PHOTO_AVATARS[c.authorId] || c.authorAvatar || '/sunwoo.jpg';
                              return (
                                <div key={c.id} className="text-xs flex items-start gap-2.5 leading-relaxed">
                                  <img 
                                    src={cAvatar} 
                                    alt={c.authorName} 
                                    referrerPolicy="no-referrer" 
                                    className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5 border border-stone-200" 
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-stone-900">
                                        {c.authorName}
                                      </span>
                                      {c.isIdol && (
                                        <span className="text-[9px] font-mono text-stone-500 bg-stone-200/80 px-1 rounded">
                                          IDOL
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-stone-800 mt-0.5">{c.korean}</p>
                                    {c.translation_zh && (
                                      <p className="text-[11px] text-stone-400 mt-0.5">
                                        {c.translation_zh}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Reply Input Bar */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="写下你的评论 (支持中韩输入)..."
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddComment(post.id);
                              }
                            }}
                            className="flex-1 text-xs px-3 py-2 rounded-full bg-stone-100 border border-stone-200 focus:bg-white focus:outline-none focus:border-stone-900 transition-all text-stone-900 placeholder:text-stone-400"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddComment(post.id)}
                            disabled={!(commentInputs[post.id] || '').trim()}
                            className="px-3.5 py-1.5 rounded-full bg-stone-900 hover:bg-black text-white text-xs font-semibold transition disabled:opacity-30 shrink-0"
                          >
                            发送
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Vocabulary Detail Modal */}
      {selectedVocabDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-stone-900 font-sans-kr">
                    {selectedVocabDetail.hangul || selectedVocabDetail.word}
                  </h3>
                  <button
                    onClick={() => speakKorean(selectedVocabDetail.hangul || selectedVocabDetail.word)}
                    className="p-1 text-stone-400 hover:text-stone-900 rounded-full hover:bg-stone-100 transition"
                  >
                    <Volume2 size={15} />
                  </button>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  {selectedVocabDetail.type || '단어'} {selectedVocabDetail.origin ? `· ${selectedVocabDetail.origin}` : ''}
                </p>
              </div>
              <button
                onClick={() => setSelectedVocabDetail(null)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl space-y-1.5 border border-stone-100 text-xs">
              <span className="text-[11px] text-stone-400 font-medium block">中文释义</span>
              <p className="font-semibold text-stone-900 text-sm">{selectedVocabDetail.meaning_zh}</p>
            </div>

            {selectedVocabDetail.example_kr && (
              <div className="space-y-1 text-xs">
                <span className="text-[11px] text-stone-400 font-medium block">实用例句</span>
                <p className="text-stone-900 font-sans-kr font-medium">{selectedVocabDetail.example_kr}</p>
                {selectedVocabDetail.example_zh && (
                  <p className="text-stone-500">{selectedVocabDetail.example_zh}</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  onSaveVocab(selectedVocabDetail);
                  showSuccessToast('已添加至生词本', `${selectedVocabDetail.hangul || selectedVocabDetail.word}: ${selectedVocabDetail.meaning_zh}`);
                  setSelectedVocabDetail(null);
                }}
                className="w-full py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                <span>加入生词研习本</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl">
            <img 
              src={lightboxImage} 
              alt="Enlarged view" 
              referrerPolicy="no-referrer" 
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
