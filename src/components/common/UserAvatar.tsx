import React, { useState } from 'react';
import { User, UserStatus } from '../../types';

interface UserAvatarProps {
  user?: Partial<User> | null;
  name?: string;
  avatarUrl?: string;
  avatarColor?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  showStatus?: boolean;
  status?: UserStatus | 'online' | 'present' | 'checked_out' | 'absent';
  className?: string;
  borderClassName?: string;
}

const SIZE_MAP = {
  xs: { box: 'w-6 h-6', text: 'text-[10px]', statusBox: 'w-2 h-2', statusOffset: '-bottom-0.5 -right-0.5' },
  sm: { box: 'w-8 h-8', text: 'text-xs', statusBox: 'w-2.5 h-2.5', statusOffset: '-bottom-0.5 -right-0.5' },
  md: { box: 'w-10 h-10', text: 'text-sm', statusBox: 'w-3 h-3', statusOffset: 'bottom-0 right-0' },
  lg: { box: 'w-12 h-12', text: 'text-base', statusBox: 'w-3.5 h-3.5', statusOffset: 'bottom-0 right-0' },
  xl: { box: 'w-16 h-16', text: 'text-xl', statusBox: 'w-4 h-4', statusOffset: 'bottom-0.5 right-0.5' },
  '2xl': { box: 'w-20 h-20', text: 'text-2xl', statusBox: 'w-5 h-5', statusOffset: 'bottom-1 right-1' },
  '3xl': { box: 'w-24 h-24', text: 'text-3xl', statusBox: 'w-6 h-6', statusOffset: 'bottom-1 right-1' },
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  name: propName,
  avatarUrl: propAvatarUrl,
  avatarColor: propAvatarColor,
  size = 'md',
  showStatus = false,
  status: propStatus,
  className = '',
  borderClassName = 'ring-2 ring-white',
}) => {
  const [imageError, setImageError] = useState(false);

  const name = propName || user?.name || 'Staff';
  const avatarUrl = propAvatarUrl || user?.avatarUrl;
  const avatarColor = propAvatarColor || user?.avatarColor || 'bg-indigo-600';
  const status = propStatus || user?.status || 'active';

  const config = SIZE_MAP[size] || SIZE_MAP.md;

  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  const hasImage = !!avatarUrl && !imageError;

  let statusColor = 'bg-emerald-500 ring-white';
  if (status === 'disabled' || status === 'absent') {
    statusColor = 'bg-slate-400 ring-white';
  } else if (status === 'pending' || status === 'half_day') {
    statusColor = 'bg-amber-500 ring-white';
  } else if (status === 'checked_out') {
    statusColor = 'bg-sky-500 ring-white';
  }

  return (
    <div className={`relative inline-flex shrink-0 ${config.box} ${className}`}>
      {hasImage ? (
        <img
          src={avatarUrl}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className={`w-full h-full rounded-full object-cover shadow-xs ${borderClassName}`}
        />
      ) : (
        <div
          className={`w-full h-full rounded-full ${avatarColor} text-white flex items-center justify-center font-bold tracking-wider shadow-xs ${config.text} ${borderClassName}`}
        >
          {initials}
        </div>
      )}

      {showStatus && (
        <span
          className={`absolute ${config.statusOffset} ${config.statusBox} rounded-full ring-2 ${statusColor} shrink-0`}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};
