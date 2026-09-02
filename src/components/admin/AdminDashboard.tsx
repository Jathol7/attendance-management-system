import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, AttendanceLog, AttendanceSummary } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import { ManualLogModal } from './ManualLogModal';
import { AddEmployeeModal } from './AddEmployeeModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { EditEmployeeModal } from './EditEmployeeModal';
import {
  Users,
  Activity,
  CheckCircle2,
  UserX,
  Clock,
  Search,
  Filter,
  Download,
  Plus,
  Edit3,
  Trash2,
  ShieldCheck,
  UserCheck,
  UserPlus,
  KeyRound,
  AlertTriangle,
  Building,
  Calendar,
  Sparkles,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  Check,
  X as XIcon,
  ChevronRight,
  Info
} from 'lucide-react';
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from '../../types';

const DEPARTMENTS = [
  'All Departments',
  'Software Engineering',
  'Product & Design',
  'Human Resources',
  'Marketing & Sales',
  'Executive Operations',
  'Customer Support',
  'Finance & Legal',
];

interface AdminDashboardProps {
  activeTab?: 'live' | 'logs' | 'employees' | 'reports' | 'system';
  onTabChange?: (tab: 'live' | 'logs' | 'employees' | 'reports' | 'system') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeTab: propActiveTab,
  onTabChange,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<'live' | 'logs' | 'employees' | 'reports' | 'system'>('live');
  const activeTab = propActiveTab || internalActiveTab;
  const setActiveTab = (tab: 'live' | 'logs' | 'employees' | 'reports' | 'system') => {
    setInternalActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };


  // Summary KPIs
  const [summary, setSummary] = useState<AttendanceSummary & { todayDate: string }>({
    totalStaff: 0,
    activeNow: 0,
    checkedOutToday: 0,
    absentToday: 0,
    pendingApprovals: 0,
    departmentStats: {},
    todayDate: '',
  });

  // Live Grid
  const [liveGrid, setLiveGrid] = useState<any[]>([]);
  const [liveSearch, setLiveSearch] = useState('');
  const [liveDeptFilter, setLiveDeptFilter] = useState('All Departments');
  const [liveStatusFilter, setLiveStatusFilter] = useState<'all' | 'present' | 'checked_out' | 'absent'>('all');

  // Time Logs
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [logSearch, setLogSearch] = useState('');
  const [logDept, setLogDept] = useState('all');
  const [logStatus, setLogStatus] = useState('all');
  const [logStartDate, setLogStartDate] = useState('');
  const [logEndDate, setLogEndDate] = useState('');

  // Employees List
  const [employees, setEmployees] = useState<User[]>([]);
  const [empSearch, setEmpSearch] = useState('');
  const [empStatusFilter, setEmpStatusFilter] = useState<'all' | 'active' | 'pending' | 'disabled'>('all');

  // Modals state
  const [manualLogOpen, setManualLogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<AttendanceLog | null>(null);
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [targetResetUser, setTargetResetUser] = useState<User | null>(null);
  const [editEmployeeOpen, setEditEmployeeOpen] = useState(false);
  const [targetEditUser, setTargetEditUser] = useState<User | null>(null);

  // Export State
  const [exportMonth, setExportMonth] = useState<number>(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState<number>(new Date().getFullYear());
  const [exportDept, setExportDept] = useState('all');

  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, gridRes, logsRes, empRes] = await Promise.all([
        api.getAdminSummary(),
        api.getLiveGrid(),
        api.getAllLogs({
          department: logDept !== 'all' ? logDept : undefined,
          status: logStatus !== 'all' ? logStatus : undefined,
          startDate: logStartDate || undefined,
          endDate: logEndDate || undefined,
          search: logSearch || undefined,
        }),
        api.getEmployees(),
      ]);

      setSummary(sumRes);
      setLiveGrid(gridRes.employees);
      setLogs(logsRes.logs);
      setEmployees(empRes.employees);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      showNotification(err.message || 'Failed to sync data with server.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [logDept, logStatus, logStartDate, logEndDate, logSearch]);

  // Employee action handlers
  const handleApprove = async (user: User) => {
    try {
      const res = await api.approveEmployee(user.id);
      showNotification(res.message, 'success');
      fetchAllData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to approve employee.', 'error');
    }
  };

  const handleReject = async (user: User) => {
    if (!window.confirm(`Are you sure you want to reject and remove registration request for ${user.name}?`)) return;
    try {
      const res = await api.rejectEmployee(user.id);
      showNotification(res.message, 'success');
      fetchAllData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to reject employee.', 'error');
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    try {
      const res = await api.updateEmployee(user.id, { status: newStatus });
      showNotification(res.message, 'success');
      fetchAllData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to update employee status.', 'error');
    }
  };

  const handleDeleteEmployee = async (user: User) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to PERMANENTLY delete employee "${user.name}" (${user.email})?\n\nThis will remove their profile and all linked attendance logs permanently. This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      const res = await api.deleteEmployee(user.id);
      showNotification(res.message, 'success');
      fetchAllData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete employee account.', 'error');
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this attendance log?')) return;
    try {
      const res = await api.deleteManualLog(id);
      showNotification(res.message, 'success');
      fetchAllData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete record.', 'error');
    }
  };

  const handleSeedDatabase = async () => {
    if (!window.confirm('Reset database and seed sample master data with realistic attendance logs?')) return;
    try {
      const res = await api.seedDatabase();
      showNotification(res.message, 'success');
      fetchAllData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to seed database.', 'error');
    }
  };

  // Filtered live grid
  const filteredLiveGrid = liveGrid.filter((item) => {
    const matchesSearch =
      item.user.name.toLowerCase().includes(liveSearch.toLowerCase()) ||
      item.user.email.toLowerCase().includes(liveSearch.toLowerCase()) ||
      item.user.department.toLowerCase().includes(liveSearch.toLowerCase()) ||
      (item.user.jobTitle && item.user.jobTitle.toLowerCase().includes(liveSearch.toLowerCase()));
    const matchesDept =
      liveDeptFilter === 'All Departments' || item.user.department === liveDeptFilter;
    const matchesStatus =
      liveStatusFilter === 'all' ||
      (liveStatusFilter === 'present' && item.status === 'present') ||
      (liveStatusFilter === 'checked_out' && (item.status === 'checked_out' || item.status === 'half_day')) ||
      (liveStatusFilter === 'absent' && item.status === 'absent');
    return matchesSearch && matchesDept && matchesStatus;
  });

  // Filtered employees list
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(empSearch.toLowerCase()) ||
      emp.email.toLowerCase().includes(empSearch.toLowerCase()) ||
      emp.department.toLowerCase().includes(empSearch.toLowerCase());
    const matchesStatus = empStatusFilter === 'all' || emp.status === empStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Master Operations Console
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-mono">Current Date: {summary.todayDate || '2026-09-02'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Workforce Attendance Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time biometric punch tracking, staff onboarding, time audit overrides, and payroll exports.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="admin-add-emp-btn"
            onClick={() => setAddEmployeeOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
          <button
            id="admin-add-manual-log-btn"
            onClick={() => {
              setEditingLog(null);
              setManualLogOpen(true);
            }}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Manual Time Log</span>
          </button>
          <button
            onClick={fetchAllData}
            title="Refresh state"
            className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Metric KPI Cards in Professional Polish Design - Interactive Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Staff */}
        <button
          id="kpi-btn-total-staff"
          onClick={() => {
            setActiveTab('employees');
            setEmpStatusFilter('all');
          }}
          className={`text-left p-5 rounded-xl border shadow-xs flex flex-col justify-between transition-all hover:scale-[1.01] cursor-pointer ${
            activeTab === 'employees' && empStatusFilter === 'all'
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Staff</p>
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{summary.totalStaff}</p>
          </div>
          <div className="mt-2 text-xs text-indigo-600 font-semibold flex items-center justify-between">
            <span>View Directory</span>
            <span>&rarr;</span>
          </div>
        </button>

        {/* Active Now */}
        <button
          id="kpi-btn-present-today"
          onClick={() => {
            setActiveTab('live');
            setLiveStatusFilter('present');
          }}
          className={`text-left p-5 rounded-xl border shadow-xs flex flex-col justify-between transition-all hover:scale-[1.01] cursor-pointer ${
            activeTab === 'live' && liveStatusFilter === 'present'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Present Today</p>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
              </div>
            </div>
            <p className="text-3xl font-bold text-emerald-600 flex items-center gap-2">
              {summary.activeNow}
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            </p>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-semibold flex items-center justify-between">
            <span>
              {summary.totalStaff > 0 ? Math.round((summary.activeNow / summary.totalStaff) * 100) : 0}% Active
            </span>
            <span>&rarr;</span>
          </div>
        </button>

        {/* Checked Out Today */}
        <button
          id="kpi-btn-checked-out"
          onClick={() => {
            setActiveTab('live');
            setLiveStatusFilter('checked_out');
          }}
          className={`text-left p-5 rounded-xl border shadow-xs flex flex-col justify-between transition-all hover:scale-[1.01] cursor-pointer ${
            activeTab === 'live' && liveStatusFilter === 'checked_out'
              ? 'bg-sky-50/80 border-sky-300 ring-2 ring-sky-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Checked Out</p>
              <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-sky-600">{summary.checkedOutToday}</p>
          </div>
          <div className="mt-2 text-xs text-sky-700 font-semibold flex items-center justify-between">
            <span>Completed Shifts</span>
            <span>&rarr;</span>
          </div>
        </button>

        {/* Absent Today */}
        <button
          id="kpi-btn-absent-today"
          onClick={() => {
            setActiveTab('live');
            setLiveStatusFilter('absent');
          }}
          className={`text-left p-5 rounded-xl border shadow-xs flex flex-col justify-between transition-all hover:scale-[1.01] cursor-pointer ${
            activeTab === 'live' && liveStatusFilter === 'absent'
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Absent Today</p>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <UserX className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-rose-600">{summary.absentToday}</p>
          </div>
          <div className="mt-2 text-xs text-rose-700 font-semibold flex items-center justify-between">
            <span>No Punch Logged</span>
            <span>&rarr;</span>
          </div>
        </button>

        {/* Pending Approvals */}
        <button
          id="kpi-btn-pending"
          onClick={() => {
            setActiveTab('employees');
            setEmpStatusFilter('pending');
          }}
          className={`col-span-2 lg:col-span-1 p-5 rounded-xl border shadow-xs cursor-pointer transition-all text-left flex flex-col justify-between hover:scale-[1.01] ${
            activeTab === 'employees' && empStatusFilter === 'pending'
              ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-500/20'
              : summary.pendingApprovals > 0
              ? 'bg-amber-50/80 border-amber-300 hover:bg-amber-100/70'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Pending</p>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${summary.pendingApprovals > 0 ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                <UserPlus className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-amber-700">{summary.pendingApprovals}</p>
          </div>
          <div className="mt-2 text-xs text-amber-900 font-semibold flex items-center justify-between">
            <span>Self-registered</span>
            <span className="text-indigo-600 flex items-center">Review &rarr;</span>
          </div>
        </button>
      </div>

      {/* Main Tab Navigation Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 px-6 pt-3 flex flex-wrap gap-2 sm:gap-6 bg-slate-50/50">
          <button
            id="tab-admin-live"
            onClick={() => setActiveTab('live')}
            className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'live'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Live Attendance Grid</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700">
              {summary.activeNow} Active
            </span>
          </button>

          <button
            id="tab-admin-logs"
            onClick={() => setActiveTab('logs')}
            className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'logs'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Time Logs & Audit Overrides</span>
          </button>

          <button
            id="tab-admin-employees"
            onClick={() => setActiveTab('employees')}
            className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'employees'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Employee Management</span>
            {summary.pendingApprovals > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                {summary.pendingApprovals} Pending
              </span>
            )}
          </button>

          <button
            id="tab-admin-reports"
            onClick={() => setActiveTab('reports')}
            className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'reports'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Payroll Reports & CSV Export</span>
          </button>

          <button
            id="tab-admin-system"
            onClick={() => setActiveTab('system')}
            className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'system'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>System Master Setup</span>
          </button>
        </div>


        {/* Tab 1: Live Attendance Grid */}
        {activeTab === 'live' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  value={liveSearch}
                  onChange={(e) => setLiveSearch(e.target.value)}
                  placeholder="Search staff by name, email or role..."
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={liveDeptFilter}
                  onChange={(e) => setLiveDeptFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Status Filters */}
            <div className="flex items-center gap-2 flex-wrap pb-1 border-b border-slate-100">
              <button
                id="live-filter-all"
                onClick={() => setLiveStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  liveStatusFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Staff ({liveGrid.length})
              </button>
              <button
                id="live-filter-present"
                onClick={() => setLiveStatusFilter('present')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  liveStatusFilter === 'present'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Present ({summary.activeNow})
              </button>
              <button
                id="live-filter-checked-out"
                onClick={() => setLiveStatusFilter('checked_out')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  liveStatusFilter === 'checked_out'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
                }`}
              >
                Checked Out ({summary.checkedOutToday})
              </button>
              <button
                id="live-filter-absent"
                onClick={() => setLiveStatusFilter('absent')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  liveStatusFilter === 'absent'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                Absent Today ({summary.absentToday})
              </button>
            </div>

            {/* Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLiveGrid.length === 0 ? (
                <div className="col-span-3 py-12 text-center text-slate-400 text-xs">
                  No staff members match the current filter.
                </div>
              ) : (
                filteredLiveGrid.map((item) => {
                  const isPresent = item.status === 'present';
                  const isCheckedOut = item.status === 'checked_out' || item.status === 'half_day';
                  const isAbsent = item.status === 'absent';

                  return (
                    <div
                      key={item.user.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              user={item.user}
                              size="lg"
                              showStatus={false}
                            />
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 leading-tight">{item.user.name}</h4>
                              <p className="text-[11px] text-slate-500">{item.user.jobTitle || 'Staff'}</p>
                              <span className="inline-block text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-medium mt-0.5">
                                {item.user.department}
                              </span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div>
                            {isPresent && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Present
                              </span>
                            )}
                            {isCheckedOut && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                                Checked Out
                              </span>
                            )}
                            {isAbsent && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                Absent Today
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Punch stats */}
                        <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-slate-50 rounded-xl text-xs">
                          <div>
                            <span className="text-[10px] font-medium text-slate-500 block">Check-In</span>
                            <span className="font-mono font-bold text-slate-800">
                              {item.checkInTime || '--:--'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-medium text-slate-500 block">Check-Out</span>
                            <span className="font-mono font-bold text-slate-800">
                              {item.checkOutTime || (isPresent ? 'Active Now' : '--:--')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{item.location || 'Headquarters'}</span>
                        <button
                          onClick={() => {
                            if (item.todayLog) {
                              setEditingLog(item.todayLog);
                              setManualLogOpen(true);
                            } else {
                              setEditingLog({
                                id: '',
                                userId: item.user.id,
                                userName: item.user.name,
                                userEmail: item.user.email,
                                department: item.user.department,
                                date: summary.todayDate,
                                checkInTime: '09:00:00',
                                checkOutTime: '17:00:00',
                                totalHours: 8,
                                status: 'checked_out',
                                modifiedByAdmin: true,
                              });
                              setManualLogOpen(true);
                            }
                          }}
                          className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Audit Log</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Detailed Time Logs & Overrides */}
        {activeTab === 'logs' && (
          <div className="p-6 space-y-6">
            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Filter name or email..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              <div>
                <select
                  value={logDept}
                  onChange={(e) => setLogDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                >
                  <option value="all">All Departments</option>
                  {DEPARTMENTS.filter((d) => d !== 'All Departments').map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={logStatus}
                  onChange={(e) => setLogStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                >
                  <option value="all">All Statuses</option>
                  <option value="present">Present (In Progress)</option>
                  <option value="checked_out">Checked Out</option>
                  <option value="half_day">Half Day (&lt;4h)</option>
                </select>
              </div>

              <div>
                <input
                  type="date"
                  value={logStartDate}
                  onChange={(e) => setLogStartDate(e.target.value)}
                  placeholder="Start Date"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                />
              </div>

              <div>
                <input
                  type="date"
                  value={logEndDate}
                  onChange={(e) => setLogEndDate(e.target.value)}
                  placeholder="End Date"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">In / Out Times</th>
                    <th className="px-5 py-3">Total Hours</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Audit / Admin Note</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 text-xs">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                        No logs match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900">{log.userName}</div>
                          <div className="text-[11px] text-slate-500">{log.userEmail}</div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700">{log.department}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800 whitespace-nowrap">{log.date}</td>
                        <td className="px-5 py-3.5 font-mono text-slate-700 whitespace-nowrap">
                          {log.checkInTime || '--:--'} &rarr; {log.checkOutTime || '--:--'}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-900">
                          {log.totalHours !== undefined ? `${log.totalHours.toFixed(1)} hrs` : (log.status === 'present' ? 'In Progress' : '--')}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {log.status === 'present' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Present
                            </span>
                          )}
                          {log.status === 'checked_out' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                              Checked Out
                            </span>
                          )}
                          {log.status === 'half_day' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Half Day
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 max-w-xs">
                          {log.modifiedByAdmin && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 mb-1">
                              Admin Override
                            </span>
                          )}
                          {log.adminNote ? (
                            <p className="text-[11px] text-slate-700 truncate" title={log.adminNote}>
                              {log.adminNote}
                            </p>
                          ) : (
                            <span className="text-[11px] text-slate-400">Regular scan</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingLog(log);
                                setManualLogOpen(true);
                              }}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                              title="Edit Log"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="Delete Log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Employee Management Module */}
        {activeTab === 'employees' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  placeholder="Search employees by name or email..."
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={empStatusFilter}
                  onChange={(e) => setEmpStatusFilter(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Staff</option>
                  <option value="pending">Pending Approval</option>
                  <option value="disabled">Deactivated / Former</option>
                </select>

                <button
                  onClick={() => setAddEmployeeOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>New Staff</span>
                </button>
              </div>
            </div>

            {/* Employee Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3">Employee Name</th>
                    <th className="px-5 py-3">Work Email</th>
                    <th className="px-5 py-3">Department & Title</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Onboarding Password</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 text-xs">
                  {filteredEmployees.map((emp) => {
                    const isPending = emp.status === 'pending';
                    const isActive = emp.status === 'active';
                    const isDisabled = emp.status === 'disabled';

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <UserAvatar
                              user={emp}
                              size="sm"
                              showStatus={false}
                            />
                            <span className="font-semibold text-slate-900">{emp.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-600">{emp.email}</td>
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-slate-800">{emp.department}</div>
                          <div className="text-[11px] text-slate-500">{emp.jobTitle || 'Staff Member'}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          {emp.role === 'admin' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Admin
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                              Employee
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {isActive && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active
                            </span>
                          )}
                          {isPending && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                              Pending Approval
                            </span>
                          )}
                          {isDisabled && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                              Deactivated
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {emp.isFirstLogin ? (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Temp / Reset Required
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-700 font-medium">Custom Password Set</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => handleApprove(emp)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleReject(emp)}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                                >
                                  <XIcon className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setTargetEditUser(emp);
                                    setEditEmployeeOpen(true);
                                  }}
                                  className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Edit Employee Profile"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setTargetResetUser(emp);
                                    setResetPasswordOpen(true);
                                  }}
                                  className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                                  title="Reset Password"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(emp)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                                    isActive
                                      ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                                      : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                                  }`}
                                  title={isActive ? 'Deactivate Account' : 'Activate Account'}
                                >
                                  {isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  id={`delete-emp-btn-${emp.id}`}
                                  onClick={() => handleDeleteEmployee(emp)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Permanently Delete Employee Account"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Reports & Export */}
        {activeTab === 'reports' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Attendance & Payroll Export Center</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate formatted CSV export files for payroll processing, overtime calculations, and compliance audits.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Report 1: Monthly Payroll Summary */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-3">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Monthly Payroll Hours Summary (CSV)</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Aggregated metrics per employee: Total Days Worked, Regular Hours (up to 8h/day), and Overtime Hours. Ideal for finance & payroll.
                  </p>

                  <div className="my-4 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Billing Month</label>
                      <select
                        value={exportMonth}
                        onChange={(e) => setExportMonth(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
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
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Billing Year</label>
                      <select
                        value={exportYear}
                        onChange={(e) => setExportYear(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      >
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                        <option value={2027}>2027</option>
                      </select>
                    </div>
                  </div>
                </div>

                <a
                  href={api.getExportUrl({ month: exportMonth, year: exportYear, reportType: 'payroll-summary' })}
                  download
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Payroll Summary CSV</span>
                </a>
              </div>

              {/* Report 2: Detailed Attendance Register */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Detailed Attendance Register (CSV)</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Line-by-line itemized punch log containing individual check-in/out timestamps, administrative override notes, and location data.
                  </p>

                  <div className="my-4 text-xs">
                    <label className="block text-slate-600 font-medium mb-1">Department Filter</label>
                    <select
                      value={exportDept}
                      onChange={(e) => setExportDept(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="all">All Departments</option>
                      {DEPARTMENTS.filter((d) => d !== 'All Departments').map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <a
                  href={api.getExportUrl({
                    month: exportMonth,
                    year: exportYear,
                    department: exportDept !== 'all' ? exportDept : undefined,
                    reportType: 'detailed',
                  })}
                  download
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Detailed Register CSV</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: System Master Setup & Credentials */}
        {activeTab === 'system' && (
          <div className="p-6 space-y-6">
            <div className="max-w-2xl">
              <h3 className="text-base font-bold text-slate-900">System Setup & Seed Tools</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage initial Master Admin credentials and test data environment.
              </p>

              <div className="mt-5 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-indigo-900">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Default Master Admin Credentials</span>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div>
                    <span className="text-[10px] text-indigo-700 block">Email:</span>
                    <span className="font-semibold text-slate-900">{DEFAULT_ADMIN_EMAIL}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-indigo-700 block">Password:</span>
                    <span className="font-semibold text-slate-900">{DEFAULT_ADMIN_PASSWORD}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="text-sm font-bold text-slate-900">Reset & Seed Sample Dataset</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Populate the database with sample departments (Engineering, Product, HR, Marketing), active staff, historical logs for the current month, and pending registrations.
                </p>

                <button
                  id="admin-reseed-data-btn"
                  onClick={handleSeedDatabase}
                  className="mt-4 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Reset & Seed Fresh Test Data</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ManualLogModal
        isOpen={manualLogOpen}
        onClose={() => setManualLogOpen(false)}
        onSuccess={() => {
          showNotification('Attendance log saved successfully.', 'success');
          fetchAllData();
        }}
        employees={employees.filter((e) => e.status === 'active')}
        editingLog={editingLog}
      />

      <AddEmployeeModal
        isOpen={addEmployeeOpen}
        onClose={() => setAddEmployeeOpen(false)}
        onSuccess={() => {
          showNotification('New employee onboarded with temporary password.', 'success');
          fetchAllData();
        }}
      />

      <ResetPasswordModal
        isOpen={resetPasswordOpen}
        onClose={() => setResetPasswordOpen(false)}
        onSuccess={() => {
          showNotification('User password reset to temporary credential.', 'success');
          fetchAllData();
        }}
        targetUser={targetResetUser}
      />

      <EditEmployeeModal
        isOpen={editEmployeeOpen}
        onClose={() => setEditEmployeeOpen(false)}
        onSuccess={() => {
          showNotification('Employee details updated successfully.', 'success');
          fetchAllData();
        }}
        employee={targetEditUser}
      />
    </div>
  );
};
