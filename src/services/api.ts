import { User, AttendanceLog, AttendanceSummary, MonthlyUserStats, AuthResponse } from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('attendance_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: any = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export const api = {
  // Auth
  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse<AuthResponse>(res);
  },

  async register(payload: { name: string; email: string; password: string; department: string; jobTitle?: string; avatarUrl?: string }): Promise<{ message: string; status: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<{ message: string; status: string }>(res);
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<{ user: User }>(res);
  },

  async updateProfile(payload: { name?: string; jobTitle?: string; phone?: string; avatarUrl?: string }): Promise<{ message: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<{ message: string; user: User }>(res);
  },

  async changePassword(payload: { newPassword: string; currentPassword?: string }): Promise<{ message: string; user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<{ message: string; user: User; token: string }>(res);
  },

  async getSetupInfo(): Promise<{ adminExists: boolean; defaultAdmin: { email: string; password: string } }> {
    const res = await fetch(`${API_BASE}/auth/setup-info`);
    return handleResponse(res);
  },

  async seedDatabase(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/seed`, { method: 'POST' });
    return handleResponse<{ message: string }>(res);
  },

  // Attendance - Employee
  async getTodayAttendance(): Promise<{ log: AttendanceLog | null; todayDate: string; serverTime: string }> {
    const res = await fetch(`${API_BASE}/attendance/today`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async checkIn(payload?: { location?: string; clientTime?: string; clientTimestamp?: number; date?: string }): Promise<{ message: string; log: AttendanceLog }> {
    const res = await fetch(`${API_BASE}/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload || {}),
    });
    return handleResponse(res);
  },

  async checkOut(payload?: { clientTime?: string; clientTimestamp?: number }): Promise<{ message: string; log: AttendanceLog }> {
    const res = await fetch(`${API_BASE}/attendance/check-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload || {}),
    });
    return handleResponse(res);
  },

  async getMyLogs(params?: { month?: number; year?: number }): Promise<{ logs: AttendanceLog[]; metrics: MonthlyUserStats }> {
    const query = new URLSearchParams();
    if (params?.month) query.set('month', params.month.toString());
    if (params?.year) query.set('year', params.year.toString());

    const res = await fetch(`${API_BASE}/attendance/my-logs?${query.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Admin Dashboard
  async getAdminSummary(): Promise<AttendanceSummary & { todayDate: string }> {
    const res = await fetch(`${API_BASE}/admin/summary`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async getLiveGrid(): Promise<{
    employees: Array<{
      user: User;
      todayLog: AttendanceLog | null;
      status: string;
      checkInTime?: string;
      checkOutTime?: string;
      totalHours?: number;
      location?: string;
    }>;
    todayDate: string;
  }> {
    const res = await fetch(`${API_BASE}/admin/live-grid`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async getAllLogs(params?: {
    startDate?: string;
    endDate?: string;
    department?: string;
    userId?: string;
    search?: string;
    status?: string;
  }): Promise<{ logs: AttendanceLog[] }> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.department) query.set('department', params.department);
    if (params?.userId) query.set('userId', params.userId);
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);

    const res = await fetch(`${API_BASE}/admin/all-logs?${query.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async addManualLog(payload: {
    userId: string;
    date: string;
    checkInTime: string;
    checkOutTime?: string;
    status?: string;
    adminNote?: string;
    location?: string;
  }): Promise<{ message: string; log: AttendanceLog }> {
    const res = await fetch(`${API_BASE}/admin/manual-log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async updateManualLog(
    id: string,
    payload: {
      date?: string;
      checkInTime?: string;
      checkOutTime?: string;
      status?: string;
      adminNote?: string;
      location?: string;
    }
  ): Promise<{ message: string; log: AttendanceLog }> {
    const res = await fetch(`${API_BASE}/admin/manual-log/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async deleteManualLog(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/admin/manual-log/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Admin Employees Management
  async getEmployees(): Promise<{ employees: User[] }> {
    const res = await fetch(`${API_BASE}/admin/employees`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async createEmployee(payload: {
    name: string;
    email: string;
    department: string;
    role: string;
    temporaryPassword: string;
    jobTitle?: string;
    avatarUrl?: string;
  }): Promise<{ message: string; employee: User }> {
    const res = await fetch(`${API_BASE}/admin/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async updateEmployee(
    id: string,
    payload: {
      name?: string;
      email?: string;
      department?: string;
      role?: string;
      status?: string;
      jobTitle?: string;
      location?: string;
      phone?: string;
      shift?: string;
      hourlyRate?: number;
      avatarUrl?: string;
    }
  ): Promise<{ message: string; employee: User }> {
    const res = await fetch(`${API_BASE}/admin/employees/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async resetPassword(id: string, temporaryPassword?: string): Promise<{ message: string; temporaryPassword: string }> {
    const res = await fetch(`${API_BASE}/admin/employees/${id}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ temporaryPassword }),
    });
    return handleResponse(res);
  },

  async approveEmployee(id: string): Promise<{ message: string; employee: User }> {
    const res = await fetch(`${API_BASE}/admin/employees/${id}/approve`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async rejectEmployee(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/admin/employees/${id}/reject`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async deleteEmployee(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/admin/employees/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  getExportUrl(params: { month?: number; year?: number; department?: string; reportType: 'detailed' | 'payroll-summary' }): string {
    const query = new URLSearchParams();
    if (params.month) query.set('month', params.month.toString());
    if (params.year) query.set('year', params.year.toString());
    if (params.department) query.set('department', params.department);
    query.set('reportType', params.reportType);
    return `${API_BASE}/admin/export-csv?${query.toString()}`;
  }
};
