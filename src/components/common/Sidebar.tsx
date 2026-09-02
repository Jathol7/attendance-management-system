import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from './UserAvatar';
import {
  LayoutDashboard,
  Users,
  Clock,
  FileSpreadsheet,
  Settings,
  UserCheck,
  Shield,
  LogOut,
  Sparkles,
  CalendarCheck,
  Layers,
  ChevronRight,
  Radio
} from 'lucide-react';

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab = 'live',
  onTabChange,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { user, logout, viewMode, setViewMode } = useAuth();

  if (!user) return null;

  const isAdminView = viewMode === 'admin' && user.role === 'admin';

  const adminNavItems = [
    { id: 'live', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employee Directory', icon: Users },
    { id: 'logs', label: 'Time Logs & Overrides', icon: Clock },
    { id: 'reports', label: 'Payroll Reports', icon: FileSpreadsheet },
    { id: 'system', label: 'System Setup', icon: Settings },
  ];

  const employeeNavItems = [
    { id: 'terminal', label: 'Punch Terminal', icon: Clock },
    { id: 'history', label: 'Attendance History', icon: CalendarCheck },
  ];

  const navItems = isAdminView ? adminNavItems : employeeNavItems;

  const handleNavClick = (id: string) => {
    if (onTabChange) {
      onTabChange(id);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0f172a] text-slate-300 flex flex-col h-full shrink-0 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center space-x-3 text-white mb-6">

          <div className="w-50 h-15 bg-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/20 overflow-hidden p-2">
            <img 
              src="\images\logo.webp" 
              alt="Attendify Logo" 
              className="w-full h-full object-contain"
            />
          </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                Attendify <span className="text-indigo-400 font-semibold text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30">PRO</span>
              </span>
              <p className="text-[11px] text-slate-400">Enterprise Attendance</p>
            </div>
          </div>

          {/* Role Switcher if Admin */}
          {user.role === 'admin' && (
            <div className="mb-6 p-1 bg-slate-800/80 rounded-lg border border-slate-700/60 flex items-center text-xs">
              <button
                onClick={() => setViewMode('admin')}
                className={`flex-1 py-1.5 px-2 rounded-md font-medium flex items-center justify-center gap-1.5 transition-all ${
                  viewMode === 'admin'
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
              <button
                onClick={() => setViewMode('employee')}
                className={`flex-1 py-1.5 px-2 rounded-md font-medium flex items-center justify-center gap-1.5 transition-all ${
                  viewMode === 'employee'
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>My Portal</span>
              </button>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              {isAdminView ? 'Operations Management' : 'Employee Workspace'}
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center space-x-3 p-2.5 rounded-lg font-medium text-xs transition-all text-left ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 font-semibold'
                      : 'hover:bg-slate-800 text-slate-300 border-l-4 border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span className="flex-1 truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Live sync indicator */}
        <div className="mx-6 p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 mb-4">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-time Sync
            </span>
            <span className="text-[10px] font-mono text-indigo-400">Node/v20</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Biometric scans & cloud logs synchronized
          </p>
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className="mt-auto p-5 bg-slate-900/90 border-t border-slate-800/90">
          <div className="flex items-center space-x-3 mb-4">
            <UserAvatar
              user={user}
              size="md"
              showStatus={true}
              status="online"
              borderClassName="ring-2 ring-indigo-500/50 ring-offset-1 ring-offset-slate-900"
            />
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold truncate leading-tight">{user.name}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest truncate mt-0.5">
                {user.role === 'admin' ? 'Master Admin' : user.department}
              </p>
            </div>
          </div>
          <button
            id="sidebar-signout-btn"
            onClick={logout}
            className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-slate-600 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>SIGN OUT</span>
          </button>
        </div>
      </aside>
    </>
  );
};
