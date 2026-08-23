import React, { useState } from 'react';
import { 
  X, 
  Mic, 
  Volume2, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  Cpu, 
  FileAudio, 
  Sliders, 
  Download,
  Info
} from 'lucide-react';
import { Companion } from '../types';
import { speakKorean } from '../utils/audio';

interface VoiceCloneGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  companion: Companion;
}

export const VoiceCloneGuideModal: React.FC<VoiceCloneGuideModalProps> = ({
  isOpen,
  onClose,
  companion,
}) => {
  const [activeTab, setActiveTab] = useState<'extract' | 'clone' | 'embed'>('extract');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isTestingAudio, setIsTestingAudio] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleTestTTS = () => {
    setIsTestingAudio(true);
    speakKorean(
      companion.intro_kr,
      companion.tts_pitch,
      companion.tts_rate,
      () => setIsTestingAudio(false),
      () => setIsTestingAudio(false)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FAF9F6] w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden text-stone-800">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-sans font-bold tracking-wide">
                  伴学伙伴声线匹配与声音克隆植入指南
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 font-medium">
                  {companion.name_zh}
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                当前调教音色：{companion.voice_desc || '真实爱豆贴合声线'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-stone-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Tuning Bar */}
        <div className="bg-amber-50 border-b border-amber-200/70 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <Sliders className="w-4 h-4 text-amber-700" />
              <span className="font-medium">当前音高 (Pitch):</span>
              <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-amber-200">
                {companion.tts_pitch}x
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="font-medium">当前语速 (Rate):</span>
              <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-amber-200">
                {companion.tts_rate}x
              </span>
            </div>
          </div>

          <button
            onClick={handleTestTTS}
            disabled={isTestingAudio}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium flex items-center space-x-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{isTestingAudio ? '播放中...' : '试听当前音色'}</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-100/70 px-6 pt-2">
          <button
            onClick={() => setActiveTab('extract')}
            className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 flex items-center space-x-2 ${
              activeTab === 'extract'
                ? 'border-stone-900 text-stone-900 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <FileAudio className="w-4 h-4" />
            <span>步骤一：提取爱豆人声样本</span>
          </button>
          <button
            onClick={() => setActiveTab('clone')}
            className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 flex items-center space-x-2 ${
              activeTab === 'clone'
                ? 'border-stone-900 text-stone-900 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>步骤二：声音克隆 (Voice Clone)</span>
          </button>
          <button
            onClick={() => setActiveTab('embed')}
            className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 flex items-center space-x-2 ${
              activeTab === 'embed'
                ? 'border-stone-900 text-stone-900 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>步骤三：无缝植入网站代码</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-stone-700 font-sans">
          {activeTab === 'extract' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-2">
                <h4 className="font-bold text-stone-900 flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-xs flex items-center justify-center font-mono">1</span>
                  <span>推荐物料来源（针对 {companion.name_zh}）</span>
                </h4>
                <p className="text-stone-600 leading-relaxed text-xs sm:text-sm">
                  为了提取出最纯净、无背景音乐 (BGM) 的本人声线，建议选取：
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-stone-600">
                  <li><strong>Weverse / 官方直播或电台 (Idol Radio)</strong>：日常聊天片段，语气最自然真实。</li>
                  <li><strong>官方 Vlog / 幕后花絮 (THE BOYZ 官方频道)</strong>：选择单人面对镜头说话的片段。</li>
                  <li><strong>朗读或访谈音频</strong>：单次提取 10 秒至 1 分钟即可（格式建议为 WAV 或高质量 MP3）。</li>
                </ul>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-3">
                <h4 className="font-bold text-stone-900 flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-xs flex items-center justify-center font-mono">2</span>
                  <span>一键去除背景音 & 提取纯人声工具</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="font-bold text-stone-900 block">UVR5 (Ultimate Vocal Remover)</span>
                    <span className="text-xs text-stone-500">开源最强人声伴奏分离软件，选择 MDX-Net 算法一键提取绝对干净的爱豆人声。</span>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="font-bold text-stone-900 block">Adobe Podcast Enhance Speech</span>
                    <span className="text-xs text-stone-500">网页版免费工具，上传嘈杂录音自动消除杂音，输出录音棚级清晰干声。</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clone' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-2">
                <h4 className="font-bold text-stone-900">推荐方案 A：GPT-SoVITS (效果最逼真、韩语支持极佳)</h4>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  目前韩语与多语种声音克隆还原度最高、情绪最充沛的开源模型。仅需 <strong>5秒~1分钟</strong> 的 {companion.name_zh} 人声音频即可克隆出本人一模一样的说话语调和气声。
                </p>
                <div className="bg-stone-900 text-stone-200 p-3 rounded-xl font-mono text-xs overflow-x-auto relative">
                  <code>git clone https://github.com/RVC-Boss/GPT-SoVITS.git</code>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-2">
                <h4 className="font-bold text-stone-900">推荐方案 B：ElevenLabs / Fish Audio (云端免配置 API)</h4>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  直接在网页上传音频生成 Voice ID，调用 API 即可实时返回高质量韩语 MP3 音频流。
                </p>
              </div>
            </div>
          )}

          {activeTab === 'embed' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-stone-900">如何将生成的克隆音频 API 接入本项目：</h4>
                  <button
                    onClick={() => handleCopy(`// 在 server.ts 中将 /api/tts 替换为您部署的克隆语音端点：
app.post("/api/tts", async (req, res) => {
  const { text, characterId } = req.body;
  // 调用您的 GPT-SoVITS 或 ElevenLabs 克隆语音 API
  const audioBuffer = await fetchCustomVoice(text, characterId);
  res.set("Content-Type", "audio/mpeg");
  res.send(audioBuffer);
});`, 'embed-code')}
                    className="text-xs px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg flex items-center space-x-1"
                  >
                    {copiedCode === 'embed-code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'embed-code' ? '已复制' : '复制代码'}</span>
                  </button>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  我们已经在本项目的 <code>server.ts</code> 中预留了标准的 <code>/api/tts</code> 音频服务插槽。当前已内置基于现代韩语神经网络语音引擎，并且为李贤在（清朗磁性）、孙英宰（高亢活力）、金泳勋（温润软糯）做了专门的 Pitch 与 Rate 音色调教！
                </p>
                <div className="bg-stone-900 text-amber-300 p-3.5 rounded-xl font-mono text-xs overflow-x-auto">
                  <pre>{`// server.ts 现已支持直接接收 character 音色参数
// 若您拥有定制的 Voice ID，可直接在伴学伙伴配置中填入！`}</pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-medium text-sm transition-colors"
          >
            完成并返回
          </button>
        </div>
      </div>
    </div>
  );
};
