import React, { useState } from 'react';
import { Companion } from '../types';

interface CompanionAvatarProps {
  companion?: Partial<Companion> | null;
  className?: string;
  sizeClassName?: string;
  alt?: string;
  imgClassName?: string;
}

export const CompanionAvatar: React.FC<CompanionAvatarProps> = ({
  companion,
  className = '',
  sizeClassName = 'w-11 h-11',
  alt,
  imgClassName = ''
}) => {
  const [hasError, setHasError] = useState(false);
  const avatar = companion?.customAvatarUrl || companion?.avatar;
  const name = companion?.remark || companion?.name_zh || companion?.name_ko || companion?.name_kr || 'Buddy';

  const isUrl = Boolean(
    avatar &&
    (avatar.startsWith('http://') ||
      avatar.startsWith('https://') ||
      avatar.startsWith('/') ||
      avatar.startsWith('data:'))
  );

  // If avatar is an emoji/short symbol (not URL), display the symbol
  const isEmojiOrSymbol = Boolean(avatar && !isUrl && avatar.length <= 4);

  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 flex-shrink-0 bg-stone-100 border border-slate-200 shadow-sm relative flex items-center justify-center select-none ${sizeClassName} ${className}`}
    >
      {isUrl && !hasError ? (
        <img
          src={avatar}
          alt={alt || name}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover rounded-full flex-shrink-0 ${imgClassName}`}
        />
      ) : isEmojiOrSymbol ? (
        <div className="w-full h-full rounded-full flex items-center justify-center text-xl bg-stone-100 text-stone-700">
          {avatar}
        </div>
      ) : (
        <div className="w-full h-full rounded-full bg-gradient-to-br from-stone-100 to-stone-200 text-stone-700 font-bold flex items-center justify-center text-xs tracking-tight">
          {name.slice(0, 2)}
        </div>
      )}
    </div>
  );
};
