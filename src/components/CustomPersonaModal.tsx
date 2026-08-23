import React, { useRef } from 'react';
import { X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Companion } from '../types';
import { IDOL_PHOTO_AVATARS } from '../data/companions';

interface CustomPersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  companions: Companion[];
  selectedCompanionId: string;
  onSelectCompanion: (companion: Companion) => void;
  onSaveCompanion?: (companion: Companion) => void;
  onDeleteCompanion?: (companionId: string) => void;
  onResetDefaults?: () => void;
}

export const CustomPersonaModal: React.FC<CustomPersonaModalProps> = ({
  isOpen,
  onClose,
  companions,
  selectedCompanionId,
  onSelectCompanion,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/75 backdrop-blur-md sm:p-6 animate-in fade-in duration-300 cursor-pointer"
    >
      {/* Top Bar */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl flex items-center justify-between px-2 mb-4 shrink-0 cursor-default"
      >
        <div>
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight">대화 상대 선택</h2>
          <p className="text-xs text-white/60 mt-0.5">함께 한국어를 연습할 상대를 선택하세요</p>
        </div>
      </div>

      {/* Card Horizontal Scroll Snap Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl flex items-center justify-center group my-auto cursor-default"
      >
        {/* Desktop Arrow Buttons */}
        <button
          onClick={() => handleScroll('left')}
          className="hidden md:flex absolute -left-5 z-20 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md text-white items-center justify-center transition shadow-lg opacity-0 group-hover:opacity-100"
          aria-label="Previous"
        >
          <ChevronLeft size={22} />
        </button>

        <div
          ref={scrollRef}
          className="w-full flex items-stretch gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory py-4 px-2 sm:px-4 no-scrollbar"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}
        >
          {companions.map((comp) => {
            const isSelected = selectedCompanionId === comp.id;
            const photoSrc = comp.customAvatarUrl || comp.avatar || IDOL_PHOTO_AVATARS[comp.id] || IDOL_PHOTO_AVATARS.hyunjae;

            return (
              <div
                key={comp.id}
                onClick={() => {
                  onSelectCompanion(comp);
                  onClose();
                }}
                className={`snap-center shrink-0 w-[240px] sm:w-[260px] h-[360px] sm:h-[390px] rounded-2xl overflow-hidden relative cursor-pointer select-none transition-all duration-300 transform active:scale-95 ${
                  isSelected 
                    ? 'ring-2 ring-white shadow-2xl scale-[1.02]' 
                    : 'opacity-90 hover:opacity-100 hover:scale-[1.01] shadow-lg'
                }`}
              >
                {/* Full-bleed Photo */}
                <img
                  src={photoSrc}
                  alt={comp.name_ko || comp.name_kr}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />

                {/* Subtle Selected Badge */}
                {isSelected && (
                  <div className="absolute top-3 right-3 bg-white/90 text-stone-900 p-1.5 rounded-full shadow-md backdrop-blur-xs flex items-center justify-center">
                    <Check size={14} strokeWidth={2.5} />
                  </div>
                )}

                {/* Frosted Glass Bottom Info Bar */}
                <div className="absolute inset-x-0 bottom-0 backdrop-blur-md bg-black/40 text-white p-3.5 flex flex-col justify-end border-t border-white/10">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-medium text-lg text-white leading-tight truncate">
                      {comp.name_ko || comp.name_kr || comp.remark}
                    </h3>
                  </div>
                  <p className="text-xs text-white/80 font-normal truncate mt-1 leading-snug">
                    {comp.status_msg || '온라인'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => handleScroll('right')}
          className="hidden md:flex absolute -right-5 z-20 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md text-white items-center justify-center transition shadow-lg opacity-0 group-hover:opacity-100"
          aria-label="Next"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Bottom Hint */}
      <div className="text-center mt-3 text-xs text-white/40 font-normal">
        카드를 터치하여 바로 대화를 시작하세요
      </div>
    </div>
  );
};
