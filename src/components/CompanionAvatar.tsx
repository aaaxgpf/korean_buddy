import React, { useState } from 'react';
import { Companion } from '../types';
import { IDOL_PHOTO_AVATARS } from '../data/companions';

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
  const charId = companion?.id || 'hyunjae';
  const defaultPhoto = IDOL_PHOTO_AVATARS[charId] || IDOL_PHOTO_AVATARS.hyunjae;
  
  // Prioritize custom avatar, then companion avatar if valid URL, then default idol photo
  const rawAvatar = companion?.customAvatarUrl || companion?.avatar;
  const isUrl = Boolean(
    rawAvatar &&
    (rawAvatar.startsWith('http://') ||
      rawAvatar.startsWith('https://') ||
      rawAvatar.startsWith('/') ||
      rawAvatar.startsWith('data:'))
  );
  
  const finalSrc = (!hasError && isUrl) ? rawAvatar! : defaultPhoto;
  const name = companion?.remark || companion?.name_ko || companion?.name_kr || 'Buddy';

  return (
    <div
      className={`rounded-lg overflow-hidden shrink-0 flex-shrink-0 bg-stone-100 border border-stone-200/80 shadow-xs relative flex items-center justify-center select-none ${sizeClassName} ${className}`}
    >
      <img
        src={finalSrc}
        alt={alt || name}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover rounded-lg flex-shrink-0 ${imgClassName}`}
      />
    </div>
  );
};

