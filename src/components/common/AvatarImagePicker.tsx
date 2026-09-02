import React, { useState, useRef } from 'react';
import { UserAvatar } from './UserAvatar';
import { Upload, Link2, Sparkles, X, Image as ImageIcon, Check } from 'lucide-react';

export const AVATAR_PRESETS = [
  { label: 'Alexander (Exec)', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { label: 'Sarah (Tech)', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80' },
  { label: 'David (Dev)', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  { label: 'Elena (Design)', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80' },
  { label: 'Marcus (HR)', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80' },
  { label: 'Alex (Growth)', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80' },
  { label: 'Chloe (Product)', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80' },
  { label: 'Julian (DevOps)', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80' },
  { label: 'Olivia (Operations)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
  { label: 'Michael (Finance)', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80' },
];

interface AvatarImagePickerProps {
  currentAvatarUrl?: string;
  userName?: string;
  avatarColor?: string;
  onChange: (avatarUrl: string) => void;
}

export const AvatarImagePicker: React.FC<AvatarImagePickerProps> = ({
  currentAvatarUrl = '',
  userName = 'Staff Member',
  avatarColor = 'bg-indigo-600',
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('presets');
  const [urlInput, setUrlInput] = useState(currentAvatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setUrlInput(base64);
        onChange(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    onChange(urlInput.trim());
  };

  const handleSelectPreset = (url: string) => {
    setUrlInput(url);
    onChange(url);
  };

  const handleClear = () => {
    setUrlInput('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
          <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
          Employee Profile Picture
        </label>
        {currentAvatarUrl && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" />
            Remove Picture
          </button>
        )}
      </div>

      {/* Avatar Preview & Source Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <UserAvatar
            name={userName}
            avatarUrl={currentAvatarUrl}
            avatarColor={avatarColor}
            size="xl"
            borderClassName="ring-2 ring-indigo-500/30 ring-offset-2"
          />
          <div>
            <p className="text-xs font-semibold text-slate-800">{userName}</p>
            <p className="text-[11px] text-slate-500">
              {currentAvatarUrl ? 'Custom photo set' : 'Using default initials'}
            </p>
          </div>
        </div>

        {/* Source Mode Pills */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs w-full sm:w-auto justify-center sm:justify-start">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'presets' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Presets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'upload' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'url' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            URL
          </button>
        </div>
      </div>

      {/* Mode 1: Presets Gallery */}
      {activeTab === 'presets' && (
        <div className="pt-2 border-t border-slate-200/60">
          <p className="text-[11px] text-slate-500 mb-2 font-medium">Choose a professional staff headshot:</p>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {AVATAR_PRESETS.map((preset, idx) => {
              const isSelected = currentAvatarUrl === preset.url;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset.url)}
                  title={preset.label}
                  className={`relative rounded-full aspect-square p-0.5 transition-all overflow-hidden hover:scale-105 ${
                    isSelected ? 'ring-2 ring-indigo-600 ring-offset-2' : 'opacity-80 hover:opacity-100 border border-slate-200'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    referrerPolicy="no-referrer"
                    className="w-full h-full rounded-full object-cover"
                  />
                  {isSelected && (
                    <span className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center rounded-full">
                      <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode 2: Upload File */}
      {activeTab === 'upload' && (
        <div className="pt-2 border-t border-slate-200/60">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/png, image/jpeg, image/webp, image/gif"
            className="hidden"
            id="avatar-file-input"
          />
          <label
            htmlFor="avatar-file-input"
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white rounded-xl cursor-pointer transition-all text-center"
          >
            <Upload className="w-6 h-6 text-indigo-500 mb-1" />
            <p className="text-xs font-bold text-slate-800">Click to upload employee photo</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Supports PNG, JPG, or WebP (max 5MB)</p>
          </label>
        </div>
      )}

      {/* Mode 3: Image URL */}
      {activeTab === 'url' && (
        <div className="pt-2 border-t border-slate-200/60 space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://images.unsplash.com/... or any HTTPS image link"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Apply
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            Paste a public direct link to an avatar image (Unsplash, Gravatar, corporate directory).
          </p>
        </div>
      )}
    </div>
  );
};
