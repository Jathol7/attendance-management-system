export type UserRole = 'admin' | 'employee';
export type UserStatus = 'active' | 'pending' | 'disabled';
export type AttendanceStatus = 'present' | 'checked_out' | 'absent' | 'half_day' | 'on_leave';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  isFirstLogin: boolean;
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string;
  avatarColor?: string;
  avatarUrl?: string;
  phone?: string;
  jobTitle?: string;
  location?: string;
  shift?: string;
  hourlyRate?: number;
}

export interface AttendanceLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  department: string;
  date: string; // YYYY-MM-DD
  checkInTime?: string; // ISO or HH:MM:SS
  checkOutTime?: string; // ISO or HH:MM:SS
  checkInTimestamp?: number; // epoch ms
  checkOutTimestamp?: number; // epoch ms
  totalHours?: number; // e.g. 7.5
  status: AttendanceStatus;
  modifiedByAdmin: boolean;
  adminNote?: string;
  location?: string;
  ipAddress?: string;
}

export interface AttendanceSummary {
  totalStaff: number;
  activeNow: number;
  checkedOutToday: number;
  absentToday: number;
  pendingApprovals: number;
  departmentStats: Record<string, { total: number; present: number }>;
}

export interface MonthlyUserStats {
  totalDaysWorked: number;
  totalHours: number;
  averageDailyHours: number;
  onTimeDays: number;
  overtimeHours: number;
  halfDays: number;
}

export interface AuthResponse {
  user: User;
  token: string;
  requiresPasswordChange?: boolean;
}

export const DEFAULT_ADMIN_EMAIL = 'hammadarshad470@gmail.com';
export const DEFAULT_ADMIN_PASSWORD = 'Arshad@007';
