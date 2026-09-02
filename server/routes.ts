import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, DBUser, getTodayDateString, getCurrentTimeString, calculateHours, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from './db';
import { generateToken, sanitizeUser, requireAuth, requireAdmin, AuthenticatedRequest } from './auth';
import { AttendanceLog, AttendanceStatus, UserStatus, UserRole } from '../src/types';

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION & SETUP ENDPOINTS
// ==========================================

// Login
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.getUserByEmail(email.trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ error: 'Account has been deactivated. Please contact your system administrator.' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ 
        error: 'Your account is currently pending administrator approval. Please check back later.',
        isPending: true
      });
    }

    // Update lastLoginAt
    db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

    const token = generateToken(user);
    return res.json({
      user: sanitizeUser(user),
      token,
      requiresPasswordChange: user.isFirstLogin,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Self-Registration (Pending approval)
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, department, jobTitle, avatarUrl } = req.body;
    if (!name || !email || !password || !department) {
      return res.status(400).json({ error: 'Name, email, password, and department are required.' });
    }

    const existing = db.getUserByEmail(email.trim());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const colors = ['bg-blue-600', 'bg-indigo-600', 'bg-emerald-600', 'bg-violet-600', 'bg-amber-600', 'bg-rose-600', 'bg-teal-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newUser: DBUser = {
      id: `usr-reg-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: 'employee',
      department: department.trim(),
      jobTitle: jobTitle?.trim() || 'Staff Member',
      isFirstLogin: false,
      status: 'pending', // Requires admin approval
      createdAt: new Date().toISOString(),
      avatarColor: randomColor,
      avatarUrl: avatarUrl?.trim() || undefined,
      passwordHash,
    };

    db.createUser(newUser);

    return res.status(201).json({
      message: 'Registration submitted successfully! Your account is pending administrator approval before you can log in.',
      status: 'pending'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Registration failed.' });
  }
});

// Get Current User Profile
apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  return res.json({ user: sanitizeUser(req.user) });
});

// Update Current User Profile (Avatar Photo, Name, Job Title, Phone)
apiRouter.put('/auth/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { name, jobTitle, phone, avatarUrl } = req.body;

    const updated = db.updateUser(user.id, {
      ...(name ? { name: name.trim() } : {}),
      ...(jobTitle !== undefined ? { jobTitle: jobTitle.trim() } : {}),
      ...(phone !== undefined ? { phone: phone.trim() } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl.trim() } : {}),
    });

    if (!updated) return res.status(404).json({ error: 'User not found.' });

    return res.json({
      message: 'Profile updated successfully!',
      user: sanitizeUser(updated),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Force Password Change / Standard Password Change
apiRouter.post('/auth/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { newPassword, currentPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const user = req.user!;
    
    // If not first login, verify current password
    if (!user.isFirstLogin && currentPassword) {
      const match = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!match) {
        return res.status(400).json({ error: 'Current password does not match.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const updated = db.updateUser(user.id, {
      passwordHash,
      isFirstLogin: false,
    });

    if (!updated) return res.status(404).json({ error: 'User not found.' });

    const newToken = generateToken(updated);

    return res.json({
      message: 'Password updated successfully!',
      user: sanitizeUser(updated),
      token: newToken,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update password.' });
  }
});

// Initial Setup & Seeding Info / Reset Seed
apiRouter.get('/auth/setup-info', (req: Request, res: Response) => {
  const users = db.getUsers();
  const adminExists = users.some(u => u.role === 'admin' && u.status === 'active');
  return res.json({
    adminExists,
    defaultAdmin: {
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASSWORD,
    }
  });
});

apiRouter.post('/auth/seed', (req: Request, res: Response) => {
  db.resetAndSeed();
  return res.json({ message: 'Database reset and sample dataset seeded successfully!' });
});

// ==========================================
// 2. EMPLOYEE ATTENDANCE ENDPOINTS
// ==========================================

// Get Today's Log for logged in user
apiRouter.get('/attendance/today', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const today = getTodayDateString();
  const log = db.getTodayLogForUser(user.id, today);
  return res.json({ log: log || null, todayDate: today, serverTime: getCurrentTimeString() });
});

// Check-In
apiRouter.post('/attendance/check-in', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { location, clientTime, clientTimestamp, date: clientDate } = req.body;
    const today = clientDate || getTodayDateString();
    const currentTime = clientTime || getCurrentTimeString();
    const nowEpoch = clientTimestamp || Date.now();

    const existingLog = db.getTodayLogForUser(user.id, today);
    if (existingLog) {
      if (existingLog.checkInTime && !existingLog.checkOutTime) {
        return res.status(400).json({ error: 'You are already checked in for today.' });
      }
      if (existingLog.checkOutTime) {
        return res.status(400).json({ error: 'You have already checked out for today. Please contact your admin for any adjustments.' });
      }
    }

    const newLog: AttendanceLog = {
      id: `log-${Date.now()}-${user.id.slice(-4)}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      department: user.department,
      date: today,
      checkInTime: currentTime,
      checkInTimestamp: nowEpoch,
      status: 'present',
      modifiedByAdmin: false,
      location: location || user.location || 'Headquarters Main Office',
    };

    const savedLog = db.addAttendanceLog(newLog);
    return res.status(201).json({
      message: `Checked in successfully at ${currentTime}!`,
      log: savedLog,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record check-in.' });
  }
});

// Check-Out
apiRouter.post('/attendance/check-out', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { clientTime, clientTimestamp } = req.body;
    const today = getTodayDateString();
    const currentTime = clientTime || getCurrentTimeString();
    const nowEpoch = clientTimestamp || Date.now();

    const existingLog = db.getTodayLogForUser(user.id, today);
    if (!existingLog || !existingLog.checkInTime) {
      return res.status(400).json({ error: 'You cannot check out without checking in first.' });
    }

    if (existingLog.checkOutTime) {
      return res.status(400).json({ error: 'You have already checked out for today.' });
    }

    let totalHours = calculateHours(existingLog.checkInTime, currentTime);
    if (existingLog.checkInTimestamp && nowEpoch > existingLog.checkInTimestamp) {
      const elapsedHours = (nowEpoch - existingLog.checkInTimestamp) / (1000 * 60 * 60);
      if (elapsedHours > 0) {
        totalHours = Math.round(elapsedHours * 10) / 10;
      }
    }
    
    // Status logic: if totalHours < 4, half day or present/checked_out
    const finalStatus: AttendanceStatus = totalHours < 4 ? 'half_day' : 'checked_out';

    const updatedLog = db.updateAttendanceLog(existingLog.id, {
      checkOutTime: currentTime,
      checkOutTimestamp: nowEpoch,
      totalHours,
      status: finalStatus,
    });

    return res.json({
      message: `Checked out successfully at ${currentTime}. Total time: ${totalHours} hrs.`,
      log: updatedLog,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record check-out.' });
  }
});

// Get My Personal Attendance History & Metrics
apiRouter.get('/attendance/my-logs', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { month, year } = req.query;

    let logs = db.getAttendanceLogs().filter(l => l.userId === user.id);

    if (month && year) {
      const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
      logs = logs.filter(l => l.date.startsWith(monthPrefix));
    }

    // Sort descending by date
    logs.sort((a, b) => b.date.localeCompare(a.date));

    // Calculate metrics
    let totalDaysWorked = 0;
    let totalHours = 0;
    let onTimeDays = 0;
    let halfDays = 0;
    let overtimeHours = 0;

    logs.forEach(l => {
      if (l.checkInTime) {
        totalDaysWorked += 1;
        const [h, m] = l.checkInTime.split(':').map(Number);
        // On time if checked in on or before 09:15
        if (h < 9 || (h === 9 && m <= 15)) {
          onTimeDays += 1;
        }
      }
      if (l.totalHours) {
        totalHours += l.totalHours;
        if (l.totalHours > 8) {
          overtimeHours += (l.totalHours - 8);
        }
        if (l.totalHours < 5 && l.checkOutTime) {
          halfDays += 1;
        }
      }
    });

    const averageDailyHours = totalDaysWorked > 0 ? Math.round((totalHours / totalDaysWorked) * 10) / 10 : 0;

    return res.json({
      logs,
      metrics: {
        totalDaysWorked,
        totalHours: Math.round(totalHours * 10) / 10,
        averageDailyHours,
        onTimeDays,
        overtimeHours: Math.round(overtimeHours * 10) / 10,
        halfDays,
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch personal logs.' });
  }
});

// ==========================================
// 3. ADMIN DASHBOARD & MANAGEMENT ENDPOINTS
// ==========================================

// Live Attendance Summary & Stats
apiRouter.get('/admin/summary', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const today = getTodayDateString();
    const users = db.getUsers();
    const activeEmployees = users.filter(u => u.status === 'active' && u.role === 'employee');
    const pendingCount = users.filter(u => u.status === 'pending').length;
    const allLogs = db.getAttendanceLogs();
    const todayLogs = allLogs.filter(l => l.date === today);

    let activeNow = 0;
    let checkedOutToday = 0;
    const presentUserIds = new Set<string>();

    todayLogs.forEach(log => {
      presentUserIds.add(log.userId);
      if (log.checkInTime && !log.checkOutTime) {
        activeNow += 1;
      } else if (log.checkOutTime) {
        checkedOutToday += 1;
      }
    });

    const absentToday = Math.max(0, activeEmployees.length - presentUserIds.size);

    // Department Stats
    const departmentStats: Record<string, { total: number; present: number }> = {};
    activeEmployees.forEach(emp => {
      const dept = emp.department || 'General';
      if (!departmentStats[dept]) {
        departmentStats[dept] = { total: 0, present: 0 };
      }
      departmentStats[dept].total += 1;
      if (presentUserIds.has(emp.id)) {
        departmentStats[dept].present += 1;
      }
    });

    return res.json({
      totalStaff: activeEmployees.length,
      activeNow,
      checkedOutToday,
      absentToday,
      pendingApprovals: pendingCount,
      departmentStats,
      todayDate: today,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to compute admin summary.' });
  }
});

// Get Live Employee Grid with Today's Status
apiRouter.get('/admin/live-grid', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const today = getTodayDateString();
    const users = db.getUsers().filter(u => u.status === 'active' && u.role === 'employee');
    const todayLogs = db.getAttendanceLogs().filter(l => l.date === today);

    const logMap = new Map<string, AttendanceLog>();
    todayLogs.forEach(l => logMap.set(l.userId, l));

    const grid = users.map(user => {
      const log = logMap.get(user.id);
      let status: AttendanceStatus = 'absent';
      if (log) {
        if (log.checkInTime && !log.checkOutTime) {
          status = 'present';
        } else if (log.checkOutTime) {
          status = log.status || 'checked_out';
        }
      }

      return {
        user: sanitizeUser(user),
        todayLog: log || null,
        status,
        checkInTime: log?.checkInTime,
        checkOutTime: log?.checkOutTime,
        totalHours: log?.totalHours,
        location: log?.location,
      };
    });

    return res.json({ employees: grid, todayDate: today });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch live employee grid.' });
  }
});

// Get All Attendance Logs with Filters
apiRouter.get('/admin/all-logs', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate, department, userId, search, status } = req.query;
    let logs = [...db.getAttendanceLogs()];

    if (startDate) {
      logs = logs.filter(l => l.date >= String(startDate));
    }
    if (endDate) {
      logs = logs.filter(l => l.date <= String(endDate));
    }
    if (department && department !== 'all') {
      logs = logs.filter(l => l.department.toLowerCase() === String(department).toLowerCase());
    }
    if (userId && userId !== 'all') {
      logs = logs.filter(l => l.userId === String(userId));
    }
    if (status && status !== 'all') {
      logs = logs.filter(l => l.status === String(status));
    }
    if (search) {
      const q = String(search).toLowerCase();
      logs = logs.filter(l => 
        l.userName.toLowerCase().includes(q) ||
        l.userEmail.toLowerCase().includes(q) ||
        l.department.toLowerCase().includes(q)
      );
    }

    // Sort descending by date and checkInTime
    logs.sort((a, b) => {
      const dateDiff = b.date.localeCompare(a.date);
      if (dateDiff !== 0) return dateDiff;
      return (b.checkInTime || '').localeCompare(a.checkInTime || '');
    });

    return res.json({ logs });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch attendance logs.' });
  }
});

// Admin Add Manual Attendance Log
apiRouter.post('/admin/manual-log', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, date, checkInTime, checkOutTime, status, adminNote, location } = req.body;
    if (!userId || !date || !checkInTime) {
      return res.status(400).json({ error: 'User, date, and check-in time are required.' });
    }

    const targetUser = db.getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    let totalHours: number | undefined = undefined;
    if (checkInTime && checkOutTime) {
      totalHours = calculateHours(checkInTime, checkOutTime);
    }

    const newLog: AttendanceLog = {
      id: `log-manual-${Date.now()}`,
      userId: targetUser.id,
      userName: targetUser.name,
      userEmail: targetUser.email,
      department: targetUser.department,
      date,
      checkInTime,
      checkOutTime: checkOutTime || undefined,
      totalHours,
      status: (status as AttendanceStatus) || (checkOutTime ? 'checked_out' : 'present'),
      modifiedByAdmin: true,
      adminNote: adminNote || 'Created manually by Administrator',
      location: location || 'Manual Entry / Office Override',
    };

    const saved = db.addAttendanceLog(newLog);
    return res.status(201).json({ message: 'Manual log recorded successfully.', log: saved });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create manual log.' });
  }
});

// Admin Edit Attendance Log
apiRouter.put('/admin/manual-log/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { checkInTime, checkOutTime, date, status, adminNote, location } = req.body;

    const existing = db.getAttendanceLogs().find(l => l.id === id);
    if (!existing) {
      return res.status(404).json({ error: 'Attendance log not found.' });
    }

    let totalHours = existing.totalHours;
    const inTime = checkInTime !== undefined ? checkInTime : existing.checkInTime;
    const outTime = checkOutTime !== undefined ? checkOutTime : existing.checkOutTime;

    if (inTime && outTime) {
      totalHours = calculateHours(inTime, outTime);
    }

    const updated = db.updateAttendanceLog(id, {
      ...(date ? { date } : {}),
      checkInTime: inTime,
      checkOutTime: outTime,
      totalHours,
      status: status || (outTime ? 'checked_out' : 'present'),
      modifiedByAdmin: true,
      adminNote: adminNote || `Adjusted by Admin on ${new Date().toLocaleDateString()}`,
      ...(location ? { location } : {}),
    });

    return res.json({ message: 'Attendance record updated successfully.', log: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update attendance log.' });
  }
});

// Admin Delete Attendance Log
apiRouter.delete('/admin/manual-log/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = db.deleteAttendanceLog(id);
    if (!success) return res.status(404).json({ error: 'Log not found.' });
    return res.json({ message: 'Attendance record removed successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete record.' });
  }
});

// ==========================================
// 4. EMPLOYEE MANAGEMENT MODULE
// ==========================================

// List All Registered Employees
apiRouter.get('/admin/employees', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = db.getUsers().map(sanitizeUser);
    return res.json({ employees: users });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch employees list.' });
  }
});

// Admin Create New Employee (with temporary password & isFirstLogin: true)
apiRouter.post('/admin/employees', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, department, role, temporaryPassword, jobTitle, avatarUrl } = req.body;
    if (!name || !email || !department || !temporaryPassword) {
      return res.status(400).json({ error: 'Full name, email, department, and temporary password are required.' });
    }

    const existing = db.getUserByEmail(email.trim());
    if (existing) {
      return res.status(400).json({ error: 'An employee with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(temporaryPassword, salt);

    const colors = ['bg-blue-600', 'bg-indigo-600', 'bg-emerald-600', 'bg-violet-600', 'bg-amber-600', 'bg-rose-600', 'bg-teal-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newEmp: DBUser = {
      id: `usr-emp-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: (role as UserRole) || 'employee',
      department: department.trim(),
      jobTitle: jobTitle?.trim() || 'Staff Member',
      isFirstLogin: true, // Forces employee to change password on first login
      status: 'active',
      createdAt: new Date().toISOString(),
      avatarColor: randomColor,
      avatarUrl: avatarUrl?.trim() || undefined,
      passwordHash,
    };

    db.createUser(newEmp);

    return res.status(201).json({
      message: 'Employee registered successfully! They will be prompted to change their temporary password on first login.',
      employee: sanitizeUser(newEmp),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create employee.' });
  }
});

// Admin Update Employee Profile (Status, Role, Department, etc.)
apiRouter.put('/admin/employees/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, department, role, status, jobTitle, location, phone, shift, hourlyRate, avatarUrl } = req.body;

    const existing = db.getUserById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    // Check duplicate email if changed
    if (email && email.trim().toLowerCase() !== existing.email.toLowerCase()) {
      const emailUser = db.getUserByEmail(email.trim().toLowerCase());
      if (emailUser && emailUser.id !== id) {
        return res.status(400).json({ error: 'An account with this email address already exists.' });
      }
    }

    // Guardrail: Cannot disable or change role of last admin
    if (existing.role === 'admin' && (role === 'employee' || status === 'disabled')) {
      const admins = db.getUsers().filter(u => u.role === 'admin' && u.status === 'active');
      if (admins.length <= 1 && admins[0].id === id) {
        return res.status(400).json({ error: 'Cannot deactivate or demote the only remaining Master Admin.' });
      }
    }

    const updated = db.updateUser(id, {
      ...(name ? { name: name.trim() } : {}),
      ...(email ? { email: email.trim().toLowerCase() } : {}),
      ...(department ? { department: department.trim() } : {}),
      ...(role ? { role: role as UserRole } : {}),
      ...(status ? { status: status as UserStatus } : {}),
      ...(jobTitle ? { jobTitle: jobTitle.trim() } : {}),
      ...(location !== undefined ? { location: location.trim() } : {}),
      ...(phone !== undefined ? { phone: phone.trim() } : {}),
      ...(shift !== undefined ? { shift: shift.trim() } : {}),
      ...(hourlyRate !== undefined ? { hourlyRate: Number(hourlyRate) } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl.trim() } : {}),
    });

    return res.json({ message: 'Employee profile updated successfully.', employee: sanitizeUser(updated!) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update employee.' });
  }
});

// Admin Reset Employee Password
apiRouter.post('/admin/employees/:id/reset-password', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { temporaryPassword } = req.body;

    const user = db.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const tempPass = temporaryPassword || 'Welcome@2026';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPass, salt);

    db.updateUser(id, {
      passwordHash,
      isFirstLogin: true, // Requires password change on next login
    });

    return res.json({
      message: `Password reset successfully. Temporary password is: ${tempPass}`,
      temporaryPassword: tempPass,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// Admin Approve Pending Employee
apiRouter.post('/admin/employees/:id/approve', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = db.getUserById(id);
    if (!user) return res.status(404).json({ error: 'Employee not found.' });

    const updated = db.updateUser(id, {
      status: 'active',
    });

    return res.json({ message: `Approved registration for ${user.name}. Account is now active.`, employee: sanitizeUser(updated!) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to approve employee.' });
  }
});

// Admin Reject Pending Employee
apiRouter.post('/admin/employees/:id/reject', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = db.getUserById(id);
    if (!user) return res.status(404).json({ error: 'Employee not found.' });

    db.deleteUser(id);
    return res.json({ message: `Rejected and removed registration request for ${user.name}.` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reject employee.' });
  }
});

// Admin Permanently Delete Employee Account
apiRouter.delete('/admin/employees/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = db.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    // Guardrail: Cannot delete self
    if (req.user?.id === id) {
      return res.status(400).json({ error: 'You cannot delete your own active administrator account.' });
    }

    // Guardrail: Cannot delete the last active admin
    if (user.role === 'admin') {
      const activeAdmins = db.getUsers().filter(u => u.role === 'admin' && u.status === 'active');
      if (activeAdmins.length <= 1 && activeAdmins[0].id === id) {
        return res.status(400).json({ error: 'Cannot delete the only remaining Master Admin.' });
      }
    }

    db.deleteUser(id);
    return res.json({ message: `Employee "${user.name}" and their associated attendance records have been permanently deleted.` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete employee account.' });
  }
});

// ==========================================
// 5. REPORTS & EXPORT FOR PAYROLL
// ==========================================

apiRouter.get('/admin/export-csv', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { month, year, department, reportType } = req.query;
    const logs = db.getAttendanceLogs();
    const users = db.getUsers();

    let filteredLogs = [...logs];
    if (month && year) {
      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      filteredLogs = filteredLogs.filter(l => l.date.startsWith(prefix));
    }
    if (department && department !== 'all') {
      filteredLogs = filteredLogs.filter(l => l.department.toLowerCase() === String(department).toLowerCase());
    }

    if (reportType === 'payroll-summary') {
      // Aggregate by employee
      const userHours: Record<string, { user: DBUser; totalDays: number; totalHours: number; regularHours: number; overtimeHours: number }> = {};
      
      users.filter(u => u.role === 'employee').forEach(u => {
        userHours[u.id] = { user: u, totalDays: 0, totalHours: 0, regularHours: 0, overtimeHours: 0 };
      });

      filteredLogs.forEach(log => {
        if (userHours[log.userId]) {
          userHours[log.userId].totalDays += 1;
          const h = log.totalHours || 0;
          userHours[log.userId].totalHours += h;
          userHours[log.userId].regularHours += Math.min(8, h);
          userHours[log.userId].overtimeHours += Math.max(0, h - 8);
        }
      });

      // Build CSV
      const rows = [
        ['Employee ID', 'Full Name', 'Work Email', 'Department', 'Job Title', 'Days Worked', 'Regular Hours', 'Overtime Hours', 'Total Hours Worked', 'Status']
      ];

      Object.values(userHours).forEach(item => {
        rows.push([
          item.user.id,
          `"${item.user.name}"`,
          item.user.email,
          `"${item.user.department}"`,
          `"${item.user.jobTitle || 'Staff'}"`,
          item.totalDays.toString(),
          item.regularHours.toFixed(1),
          item.overtimeHours.toFixed(1),
          item.totalHours.toFixed(1),
          item.user.status,
        ]);
      });

      const csvContent = rows.map(r => r.join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="attendance-payroll-summary-${year || 'all'}-${month || 'all'}.csv"`);
      return res.send(csvContent);
    } else {
      // Detailed Attendance Register
      const rows = [
        ['Log ID', 'Employee Name', 'Work Email', 'Department', 'Date', 'Check In Time', 'Check Out Time', 'Total Hours', 'Status', 'Modified By Admin', 'Admin Note', 'Location']
      ];

      filteredLogs.forEach(l => {
        rows.push([
          l.id,
          `"${l.userName}"`,
          l.userEmail,
          `"${l.department}"`,
          l.date,
          l.checkInTime || 'N/A',
          l.checkOutTime || 'N/A',
          l.totalHours !== undefined ? l.totalHours.toFixed(1) : 'N/A',
          l.status,
          l.modifiedByAdmin ? 'YES' : 'NO',
          `"${l.adminNote || ''}"`,
          `"${l.location || 'Headquarters'}"`,
        ]);
      });

      const csvContent = rows.map(r => r.join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="detailed-attendance-logs-${year || 'all'}-${month || 'all'}.csv"`);
      return res.send(csvContent);
    }
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate export file.' });
  }
});
