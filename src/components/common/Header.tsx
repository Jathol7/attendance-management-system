import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from './UserAvatar';
import { EditProfileModal } from './EditProfileModal';
import {
  Clock,
  Shield,
  User as UserIcon,
  LogOut,
  Building2,
  Sparkles,
  Search,
  Menu,
  Bell,
  ChevronDown,
  CheckCircle2,
  Radio,
  Camera,
  Settings
} from 'lucide-react';

interface HeaderProps {
  onQuickSeed?: () => void;
  isTodayCheckedIn?: boolean;
  onToggleMobileSidebar?: () => void;
  onSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onQuickSeed,
  isTodayCheckedIn,
  onToggleMobileSidebar,
  onSearch,
}) => {
  const { user, logout, viewMode, setViewMode } = useAuth();
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Toggle & Global Search Bar */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {onToggleMobileSidebar && (
          <button
            id="mobile-sidebar-toggle-btn"
            onClick={onToggleMobileSidebar}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center bg-slate-100 rounded-lg px-3 py-1.5 w-48 sm:w-80 md:w-96 border border-slate-200/80 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 focus-within:bg-white">
          <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
          <input
            type="text"
            placeholder="Search records, staff, logs..."
            value={searchVal}
            onChange={(e) => {
              setSearchVal(e.target.value);
              if (onSearch) onSearch(e.target.value);
            }}
            className="bg-transparent border-none text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none w-full"
          />
        </div>
      </div>

      {/* Right: Live Sync Status Badge, Time & Quick Profile */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Live Status Pill */}
        <div className="hidden sm:flex items-center bg-indigo-50 border border-indigo-100 text-indigo-700 px-3.5 py-1.5 rounded-full text-xs font-bold gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          <span>LIVE STATUS: SYNCED</span>
        </div>

        {/* Live Clock */}
        <div className="hidden md:flex items-center space-x-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{dateStr}</span>
          <span className="font-bold text-slate-800">{timeStr}</span>
        </div>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            id="user-profile-menu-button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2.5 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <UserAvatar
              user={user}
              size="sm"
              showStatus={true}
              status="online"
              borderClassName="ring-2 ring-indigo-500/40"
            />
            <div className="text-left hidden xl:block">
              <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                {user.name}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider leading-none mt-0.5">
                {user.role === 'admin' ? 'Admin' : 'Staff'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-30 divide-y divide-slate-100 text-xs">
                <div className="px-4 py-3 flex items-center gap-3">
                  <UserAvatar
                    user={user}
                    size="md"
                    showStatus={true}
                    status="online"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate leading-tight">{user.name}</p>
                    <p className="text-slate-500 truncate text-[11px]">{user.email}</p>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-indigo-600 font-medium">
                      <Building2 className="w-3 h-3 shrink-0" />
                      <span className="truncate">{user.department}</span>
                    </div>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    id="header-edit-profile-btn"
                    onClick={() => {
                      setDropdownOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 font-medium transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Edit Profile & Photo</span>
                  </button>
                </div>

                {user.role === 'admin' && (
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setViewMode(viewMode === 'admin' ? 'employee' : 'admin');
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                    >
                      <Shield className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Switch to {viewMode === 'admin' ? 'My Portal' : 'Admin Panel'}</span>
                    </button>
                    {onQuickSeed && (
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onQuickSeed();
                        }}
                        className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Seed Sample Dataset</span>
                      </button>
                    )}
                  </div>
                )}

                <div className="py-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <EditProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </header>
  );
};

