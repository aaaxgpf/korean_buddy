import React from 'react';
import { 
  Flame, 
  Sparkles, 
  Trophy, 
  X, 
  CheckCircle2, 
  Calendar, 
  Award,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Companion, CompanionSparkRecord } from '../types';
import { SPARK_LEVELS } from '../utils/sparks';
import { CompanionAvatar } from './CompanionAvatar';

interface CompanionSparksModalProps {
  isOpen: boolean;
  onClose: () => void;
  companions: Companion[];
  sparksMap: Record<string, CompanionSparkRecord>;
  onIgniteSpark: (companionId: string) => void;
  onSelectCompanion: (companion: Companion) => void;
}

export const CompanionSparksModal: React.FC<CompanionSparksModalProps> = ({
  isOpen,
  onClose,
  companions,
  sparksMap,
  onIgniteSpark,
  onSelectCompanion,
}) => {
  if (!isOpen) return null;

  const handleIgnite = (comp: Companion) => {
    onIgniteSpark(comp.id);
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-[#E0DED7] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 bg-[#FAF9F6] border-b border-[#E0DED7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
              <Flame className="w-6 h-6 fill-amber-500 text-amber-500 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans text-xl font-bold text-[#1A1A1A]">
                  伴学火花簿 (Sparks & Streaks)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  每日续火花
                </span>
              </div>
              <p className="text-xs text-[#71675E] mt-0.5">
                每日与爱豆对话、听写、口语练习，点燃并守护专属于你们的连续互动火花！
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-200 text-[#71675E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level Progression Banner */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border-b border-[#E0DED7] grid grid-cols-4 gap-2 text-center text-xs">
          {Object.entries(SPARK_LEVELS).map(([key, lvl]) => (
            <div key={key} className="p-2 rounded-xl bg-white/70 border border-amber-100 shadow-2xs">
              <span className="text-base">{lvl.icon}</span>
              <p className="font-bold text-[#1A1A1A] mt-0.5 text-[11px]">{lvl.label}</p>
              <p className="text-[10px] text-[#8B7E74]">{lvl.minDays}天起</p>
            </div>
          ))}
        </div>

        {/* Companions Sparks List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {companions.map((comp) => {
            const spark = sparksMap[comp.id] || {
              companionId: comp.id,
              streakDays: 1,
              lastInteractionDate: '',
              totalInteractions: 1,
              sparkLevel: 'spark' as const,
              isIgnitedToday: false,
            };

            const levelInfo = SPARK_LEVELS[spark.sparkLevel] || SPARK_LEVELS.spark;

            return (
              <div
                key={comp.id}
                className="p-4 rounded-2xl border border-[#E0DED7] bg-[#FAF9F6] hover:bg-white hover:border-amber-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs group"
              >
                {/* Left: Idol Info */}
                <div className="flex items-center gap-3.5">
                  <CompanionAvatar
                    companion={comp}
                    sizeClassName="w-12 h-12"
                    alt={comp.name_zh}
                    className="border border-[#E0DED7] shadow-xs group-hover:scale-105 transition-transform"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1A1A1A] text-base">{comp.name_zh}</span>
                      <span className="text-xs text-[#71675E]">({comp.name_kr})</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${levelInfo.bg} ${levelInfo.color}`}>
                        {levelInfo.icon} {levelInfo.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#71675E] mt-0.5">
                      {comp.badge} · 累计互动 {spark.totalInteractions} 次
                    </p>
                  </div>
                </div>

                {/* Right: Streak status and Ignite action */}
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Flame className={`w-4 h-4 ${spark.isIgnitedToday ? 'fill-amber-500 text-amber-500 animate-pulse' : 'text-stone-400'}`} />
                      <span className="font-sans font-bold text-lg text-[#1A1A1A]">{spark.streakDays}</span>
                      <span className="text-xs text-[#8B7E74]">天</span>
                    </div>
                    <p className="text-[10px] text-[#71675E]">
                      {spark.isIgnitedToday ? '🔥 今日火花已点亮' : '⏳ 今日尚未互动'}
                    </p>
                  </div>

                  {spark.isIgnitedToday ? (
                    <button
                      onClick={() => {
                        onSelectCompanion(comp);
                        onClose();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>已续火 · 去聊天</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleIgnite(comp)}
                      className="px-4 py-2 rounded-xl bg-[#2D2D2D] hover:bg-[#1A1A1A] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>点燃今日火花</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#FAF9F6] border-t border-[#E0DED7] flex items-center justify-between text-xs text-[#71675E]">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>连续保持火花 7/14/30 天可解锁专属爱豆语音彩蛋与特别来信</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-[#1A1A1A] font-semibold border border-[#E0DED7] transition-colors"
          >
            完成
          </button>
        </div>

      </div>
    </div>
  );
};
