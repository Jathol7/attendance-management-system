import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AttendanceLog, MonthlyUserStats } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import { EditProfileModal } from '../common/EditProfileModal';
import {
  Clock,
  Play,
  Square,
  CheckCircle2,
  Calendar,
  BarChart3,
  TrendingUp,
  Flame,
  AlertCircle,
  Building2,
  MapPin,
  FileText,
  RotateCcw,
  Sparkles,
  Info,
  Download,
  Search,
  Filter,
  ArrowRight,
  History,
  ShieldCheck,
  CalendarDays,
  Timer,
  Camera,
  User as UserIcon,
  Phone
} from 'lucide-react';

interface EmployeePortalProps {
  activeTab?: 'terminal' | 'history';
  onTabChange?: (tab: 'terminal' | 'history') => void;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({
  activeTab: propActiveTab,
  onTabChange,
}) => {
  const { user } = useAuth();
  const [internalActiveTab, setInternalActiveTab] = useState<'terminal' | 'history'>('terminal');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  
  // Honor parent tab if passed, otherwise fall back to internal
  const currentTab = propActiveTab !== undefined ? propActiveTab : internalActiveTab;
  const setTab = (tab: 'terminal' | 'history') => {
    setInternalActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const [todayLog, setTodayLog] = useState<AttendanceLog | null>(null);
  const [todayDate, setTodayDate] = useState<string>('');
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [metrics, setMetrics] = useState<MonthlyUserStats>({
    totalDaysWorked: 0,
    totalHours: 0,
    averageDailyHours: 0,
    onTimeDays: 0,
    overtimeHours: 0,
    halfDays: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Active elapsed timer
  const [activeDuration, setActiveDuration] = useState<string>('00:00:00');
  const [liveCurrentTime, setLiveCurrentTime] = useState<string>('');

  // Month & Year Filter for History
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const fetchAttendanceData = async () => {
    try {
      const [todayRes, historyRes] = await Promise.all([
        api.getTodayAttendance(),
        api.getMyLogs({ month: selectedMonth, year: selectedYear }),
      ]);

      setTodayLog(todayRes.log);
      setTodayDate(todayRes.todayDate);
      setLogs(historyRes.logs || []);
      setMetrics(historyRes.metrics || {
        totalDaysWorked: 0,
        totalHours: 0,
        averageDailyHours: 0,
        onTimeDays: 0,
        overtimeHours: 0,
        halfDays: 0,
      });
    } catch (err: any) {
      console.error('Error fetching attendance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedMonth, selectedYear]);

  // Live wall clock timer
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Live stopwatch effect for active shift duration
  useEffect(() => {
    if (!todayLog || !todayLog.checkInTime || todayLog.checkOutTime) {
      if (todayLog && todayLog.totalHours !== undefined) {
        const hours = Math.floor(todayLog.totalHours);
        const mins = Math.round((todayLog.totalHours - hours) * 60);
        setActiveDuration(`${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`);
      } else {
        setActiveDuration('00:00:00');
      }
      return;
    }

    const calculateElapsed = () => {
      const now = Date.now();
      let startTime = todayLog.checkInTimestamp;
      if (!startTime && todayLog.checkInTime) {
        const [inH, inM, inS = '0'] = todayLog.checkInTime.split(':').map(Number);
        const d = new Date();
        d.setHours(inH, inM, Number(inS), 0);
        startTime = d.getTime();
      }
      if (!startTime) {
        setActiveDuration('00:00:00');
        return;
      }

      const diffMs = Math.max(0, now - startTime);
      const diffSecs = Math.floor(diffMs / 1000);
      const h = Math.floor(diffSecs / 3600);
      const m = Math.floor((diffSecs % 3600) / 60);
      const s = diffSecs % 60;

      setActiveDuration(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };

    calculateElapsed();
    const timer = setInterval(calculateElapsed, 1000);
    return () => clearInterval(timer);
  }, [todayLog]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setStatusMessage(null);
    try {
      const now = new Date();
      const clientTimestamp = Date.now();
      const clientTime = [
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0'),
      ].join(':');
      const userLoc = (user && user.location) || 'Headquarters Main Office';
      const res = await api.checkIn({ location: userLoc, clientTimestamp, clientTime });
      setTodayLog(res.log);
      setStatusMessage({ text: res.message, type: 'success' });
      fetchAttendanceData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Check-in failed.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setStatusMessage(null);
    try {
      const now = new Date();
      const clientTimestamp = Date.now();
      const clientTime = [
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0'),
      ].join(':');
      const res = await api.checkOut({ clientTimestamp, clientTime });
      setTodayLog(res.log);
      setStatusMessage({ text: res.message, type: 'success' });
      fetchAttendanceData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Check-out failed.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Guardrail state flags
  const isCheckedIn = !!todayLog?.checkInTime && !todayLog?.checkOutTime;
  const isCompletedToday = !!todayLog?.checkInTime && !!todayLog?.checkOutTime;
  const isNotCheckedInYet = !todayLog || !todayLog.checkInTime;

  // Filtered logs in history tab
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        !searchFilter ||
        log.date.includes(searchFilter) ||
        (log.location && log.location.toLowerCase().includes(searchFilter.toLowerCase())) ||
        (log.adminNote && log.adminNote.toLowerCase().includes(searchFilter.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'present' && log.status === 'present') ||
        (statusFilter === 'checked_out' && log.status === 'checked_out') ||
        (statusFilter === 'half_day' && log.status === 'half_day');

      return matchesSearch && matchesStatus;
    });
  }, [logs, searchFilter, statusFilter]);

  // Export personal CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('No attendance logs found to export for the selected month.');
      return;
    }
    const headers = ['Date', 'Check In', 'Check Out', 'Total Hours', 'Status', 'Location', 'Admin Adjusted'];
    const rows = filteredLogs.map((l) => [
      l.date,
      l.checkInTime || '',
      l.checkOutTime || '',
      l.totalHours !== undefined ? l.totalHours.toFixed(1) : '',
      l.status,
      `"${(l.location || 'Headquarters').replace(/"/g, '""')}"`,
      l.modifiedByAdmin ? 'YES' : 'NO',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `My_Attendance_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Profile Header Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative group shrink-0">
            <UserAvatar
              user={user}
              size="2xl"
              showStatus={true}
              status={isCheckedIn ? 'present' : isCompletedToday ? 'checked_out' : 'absent'}
              borderClassName="ring-4 ring-indigo-50 shadow-md"
            />
            <button
              type="button"
              id="emp-change-photo-btn"
              onClick={() => setIsEditProfileOpen(true)}
              title="Click to update photo"
              className="absolute inset-0 rounded-full bg-slate-950/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-2xs cursor-pointer text-[10px] font-bold"
            >
              <Camera className="w-4 h-4 mb-0.5" />
              <span>Edit</span>
            </button>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                Staff Portal
              </span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400" />
                {user?.department}
              </span>
              {user?.jobTitle && (
                <>
                  <span className="text-xs text-slate-300">•</span>
                  <span className="text-xs text-slate-500 font-medium">{user.jobTitle}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Welcome back, {user?.name}
              </h1>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(true)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
              >
                <Camera className="w-3 h-3" />
                <span>Edit Photo & Profile</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Assigned Facility: <span className="text-slate-700 font-medium">{user?.location || 'Headquarters Main Office'}</span>
              {user?.shift && <span> • Shift: <span className="text-slate-700 font-medium">{user.shift}</span></span>}
            </p>
          </div>
        </div>

        {/* Live Attendance State Pill & Tab Controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              id="emp-tab-terminal-btn"
              onClick={() => setTab('terminal')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                currentTab === 'terminal'
                  ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Punch Terminal</span>
              {isCheckedIn && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
            <button
              id="emp-tab-history-btn"
              onClick={() => setTab('history')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                currentTab === 'history'
                  ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Attendance History</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
                {logs.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onSuccess={() => fetchAttendanceData()}
      />

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1 rounded-md hover:bg-slate-200/50"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: PUNCH TERMINAL                                     */}
      {/* ========================================================= */}
      {currentTab === 'terminal' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Check-In / Check-Out Controls Terminal */}
            <div className="lg:col-span-2 bg-[#0f172a] text-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-800 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-indigo-200 border border-white/10">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      Live Punch Terminal
                    </span>
                    <span className="text-xs text-slate-400 font-mono bg-white/5 px-2.5 py-0.5 rounded-md border border-white/5">
                      {liveCurrentTime || '--:--:--'}
                    </span>
                  </div>

                  <span className="text-xs text-slate-300 font-medium">
                    Today: <strong className="text-white">{todayDate || 'Loading...'}</strong>
                  </span>
                </div>

                <div className="my-5 p-5 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                      Active Shift Duration
                    </p>
                    {isCheckedIn ? (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Session Active
                      </span>
                    ) : isCompletedToday ? (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        Shift Finished
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30">
                        Standby
                      </span>
                    )}
                  </div>

                  <div className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-white flex items-baseline gap-3 my-2">
                    {activeDuration}
                  </div>
                </div>

                {/* Timestamps row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-5">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                    <div className="text-[11px] text-slate-400 font-medium">Check-In Punch</div>
                    <div className="text-base font-bold font-mono text-white mt-1">
                      {todayLog?.checkInTime || '--:--:--'}
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                    <div className="text-[11px] text-slate-400 font-medium">Check-Out Punch</div>
                    <div className="text-base font-bold font-mono text-white mt-1">
                      {todayLog?.checkOutTime || '--:--:--'}
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1 bg-white/5 border border-white/10 rounded-xl p-3.5">
                    <div className="text-[11px] text-slate-400 font-medium">Recorded Hours</div>
                    <div className="text-base font-bold font-mono text-white mt-1">
                      {todayLog?.totalHours !== undefined
                        ? `${todayLog.totalHours.toFixed(1)} hrs`
                        : isCheckedIn
                        ? 'Calculating...'
                        : '0.0 hrs'}
                    </div>
                  </div>
                </div>
              </div>

                {/* Action Buttons with Guardrails */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  id="emp-check-in-btn"
                  onClick={handleCheckIn}
                  disabled={isCheckedIn || isCompletedToday || actionLoading}
                  className={`flex-1 py-3.5 px-5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    isNotCheckedInYet && !actionLoading
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-98'
                      : 'bg-white/10 text-white/40 border border-white/5 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{actionLoading ? 'Recording Punch...' : 'Check In to Shift'}</span>
                </button>

                <button
                  id="emp-check-out-btn"
                  onClick={handleCheckOut}
                  disabled={!isCheckedIn || actionLoading}
                  className={`flex-1 py-3.5 px-5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    isCheckedIn && !actionLoading
                      ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20 cursor-pointer active:scale-98'
                      : 'bg-white/10 text-white/40 border border-white/5 cursor-not-allowed'
                  }`}
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>{actionLoading ? 'Recording Punch...' : 'Check Out & Conclude'}</span>
                </button>
              </div>

              {/* Guardrail explanation footnote */}
              <div className="mt-4 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                {isNotCheckedInYet && <span>Press <strong>Check In</strong> to start recording your shift today.</span>}
                {isCheckedIn && <span>Your work session is actively logging. Press <strong>Check Out</strong> when leaving.</span>}
                {isCompletedToday && <span>Today's shift is finalized and logged. For adjustments, contact an administrator.</span>}
              </div>
            </div>

            {/* Right 1 Col: Facility & Shift Parameters */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  Assigned Shift & Policy
                </h2>

                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <span className="text-slate-500">Scheduled Hours</span>
                    <span className="font-semibold text-slate-800">{user?.shift || '09:00 AM – 05:00 PM'}</span>
                  </div>

                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <span className="text-slate-500">Grace Period</span>
                    <span className="font-semibold text-emerald-600">15 min (until 09:15 AM)</span>
                  </div>

                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <span className="text-slate-500">Full Shift Minimum</span>
                    <span className="font-semibold text-slate-800">8.0 Hours</span>
                  </div>

                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <span className="text-slate-500">Half Day Limit</span>
                    <span className="font-semibold text-amber-600">&lt; 4.0 Hours</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Assigned Facility</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1 text-right truncate max-w-[160px]">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">{user?.location || 'Headquarters Main Office'}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-xl">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Manual Time Correction
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  If you missed a punch or were off-site, administrators can record a backdated or override attendance log on your behalf.
                </p>
                <button
                  onClick={() => setTab('history')}
                  className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                >
                  View complete monthly history &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* Quick Snapshot: Recent Attendance History */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recent Attendance Activity</h3>
                  <p className="text-xs text-slate-500">Your latest logged work sessions this month</p>
                </div>
              </div>

              <button
                onClick={() => setTab('history')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <span>Full History & Monthly Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {logs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-slate-900">{log.date}</span>
                      {log.status === 'present' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          Active
                        </span>
                      )}
                      {log.status === 'checked_out' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700">
                          Completed
                        </span>
                      )}
                      {log.status === 'half_day' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                          Half Day
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 font-mono">
                      In: <span className="font-semibold">{log.checkInTime || '--:--'}</span> | Out:{' '}
                      <span className="font-semibold">{log.checkOutTime || '--:--'}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs font-bold text-slate-800 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-slate-500 font-normal">Shift:</span>
                    <span>{log.totalHours !== undefined ? `${log.totalHours.toFixed(1)} hrs` : 'In Progress'}</span>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="col-span-full text-center py-6 text-xs text-slate-400">
                  No previous records found for this period. Click 'Check In' above to start your first record!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ATTENDANCE HISTORY & MONTHLY SUMMARY               */}
      {/* ========================================================= */}
      {currentTab === 'history' && (
        <div className="space-y-6">
          {/* Monthly Performance KPI Metric Cards */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  Monthly Performance Summary
                </h2>
                <p className="text-xs text-slate-500">
                  Aggregated work hours and compliance statistics for the selected billing cycle.
                </p>
              </div>

              {/* Month & Year Selectors */}
              <div className="flex items-center gap-2">
                <select
                  id="emp-history-month-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={1}>January</option>
                  <option value={2}>February</option>
                  <option value={3}>March</option>
                  <option value={4}>April</option>
                  <option value={5}>May</option>
                  <option value={6}>June</option>
                  <option value={7}>July</option>
                  <option value={8}>August</option>
                  <option value={9}>September</option>
                  <option value={10}>October</option>
                  <option value={11}>November</option>
                  <option value={12}>December</option>
                </select>

                <select
                  id="emp-history-year-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>

                <button
                  id="emp-export-csv-btn"
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Days Logged</p>
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <Calendar className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">
                    {metrics.totalDaysWorked} <span className="text-xs font-normal text-slate-400">shifts</span>
                  </p>
                </div>
                <div className="mt-2 text-xs text-slate-500 font-medium">Recorded in period</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Work Hours</p>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">
                    {metrics.totalHours.toFixed(1)} <span className="text-xs font-normal text-slate-400">hrs</span>
                  </p>
                </div>
                <div className="mt-2 text-xs text-emerald-600 font-medium">
                  Avg: {metrics.averageDailyHours.toFixed(1)} hrs/shift
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">On-Time Arrival</p>
                    <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">
                    {metrics.totalDaysWorked > 0
                      ? Math.round((metrics.onTimeDays / metrics.totalDaysWorked) * 100)
                      : 100}%
                  </p>
                </div>
                <div className="mt-2 text-xs text-sky-600 font-medium">
                  {metrics.onTimeDays} of {metrics.totalDaysWorked} within grace period
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overtime Hours</p>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <Flame className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">
                    {metrics.overtimeHours.toFixed(1)} <span className="text-xs font-normal text-slate-400">hrs</span>
                  </p>
                </div>
                <div className="mt-2 text-xs text-amber-600 font-medium">
                  Cumulative extra hours
                </div>
              </div>
            </div>
          </div>

          {/* Personal Attendance History Table */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Daily Attendance Records
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed chronological breakdown of your check-in, check-out, and shift duration.
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filter by date / notes..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="present">Present / Active</option>
                  <option value="checked_out">Checked Out</option>
                  <option value="half_day">Half Day (&lt;4h)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 sticky top-0 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Check In</th>
                    <th className="px-6 py-3.5">Check Out</th>
                    <th className="px-6 py-3.5">Total Hours</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Facility / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-600">No attendance records found</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Try adjusting your search terms or month filter above.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const isPresent = log.status === 'present';
                      const isCheckedOut = log.status === 'checked_out';
                      const isHalfDay = log.status === 'half_day';

                      return (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                            {log.date}
                            {log.date === todayDate && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                                Today
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-700 whitespace-nowrap">
                            {log.checkInTime || '--:--:--'}
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-700 whitespace-nowrap">
                            {log.checkOutTime || '--:--:--'}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                            {log.totalHours !== undefined ? (
                              <span className={log.totalHours >= 8 ? 'text-slate-900' : 'text-amber-700'}>
                                {log.totalHours.toFixed(1)} hrs
                              </span>
                            ) : isPresent ? (
                              <span className="text-emerald-600 font-medium">In Progress</span>
                            ) : (
                              '--'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isPresent && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Present / Active
                              </span>
                            )}
                            {isCheckedOut && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-700">
                                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                                Checked Out
                              </span>
                            )}
                            {isHalfDay && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                                Half Day (&lt;4h)
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            <div className="flex items-center gap-2">
                              <span>{log.location || 'Headquarters Main Office'}</span>
                              {log.modifiedByAdmin && (
                                <span
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200"
                                  title={log.adminNote || 'Adjusted by Administrator'}
                                >
                                  Admin Override
                                </span>
                              )}
                            </div>
                            {log.adminNote && (
                              <p className="text-[11px] text-purple-600 italic mt-0.5">{log.adminNote}</p>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
