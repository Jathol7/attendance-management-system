import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, AttendanceLog, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from '../src/types';

export { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD };

export interface DBUser extends User {
  passwordHash: string;
}

interface DatabaseSchema {
  users: DBUser[];
  attendanceLogs: AttendanceLog[];
  systemConfig: {
    initialized: boolean;
    workDayStart: string; // e.g. "09:00"
    workDayEnd: string; // e.g. "17:00"
    standardHours: number; // e.g. 8
  };
}

// Detect Vercel Environment and safely route DB path to writable /tmp directory
const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
const DATA_DIR = isVercel ? '/tmp' : path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'attendance_db.json');

// Ensure data directory exists (Safely handled)
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create data directory, using in-memory fallback:', e);
}

let dbCache: DatabaseSchema | null = null;

export function getTodayDateString(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  return d.toISOString().split('T')[0];
}

export function getCurrentTimeString(): string {
  const now = new Date();
  return now.toTimeString().split(' ')[0]; // HH:MM:SS
}

export function calculateHours(checkIn: string, checkOut: string): number {
  try {
    const [inH, inM, inS = '0'] = checkIn.split(':').map(Number);
    const [outH, outM, outS = '0'] = checkOut.split(':').map(Number);
    const inTotalMinutes = inH * 60 + inM + Number(inS) / 60;
    const outTotalMinutes = outH * 60 + outM + Number(outS) / 60;
    
    let diffMinutes = outTotalMinutes - inTotalMinutes;
    if (diffMinutes < 0) diffMinutes += 24 * 60; // overnight handling
    return Math.round((diffMinutes / 60) * 10) / 10;
  } catch {
    return 0;
  }
}

export function initializeDatabase(): DatabaseSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(data);
      if (dbCache && Array.isArray(dbCache.users) && Array.isArray(dbCache.attendanceLogs)) {
        return dbCache;
      }
    } catch (e) {
      console.error('Error loading database file, re-initializing...', e);
    }
  }

  // Seed default master data
  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, salt);

  const initialUsers: DBUser[] = [
    {
      id: 'usr-admin-1',
      name: 'Attendify Admin',
      email: DEFAULT_ADMIN_EMAIL,
      role: 'admin',
      department: 'Software Engineering',
      isFirstLogin: false,
      status: 'active',
      createdAt: new Date().toISOString(),
      jobTitle: 'System Administrator',
      avatarColor: 'bg-indigo-600',
      passwordHash: adminPasswordHash,
    }
  ];

  const sampleLogs: AttendanceLog[] = [];

  dbCache = {
    users: initialUsers,
    attendanceLogs: sampleLogs,
    systemConfig: {
      initialized: true,
      workDayStart: '09:00',
      workDayEnd: '17:00',
      standardHours: 8,
    },
  };

  saveDatabase(dbCache);
  return dbCache;
}

export function getDatabase(): DatabaseSchema {
  if (!dbCache) {
    return initializeDatabase();
  }
  return dbCache;
}

export function saveDatabase(data: DatabaseSchema): void {
  try {
    dbCache = data;
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Filesystem write ignored on serverless runtime:', err);
  }
}

// Database helper functions
export const db = {
  getUsers: () => getDatabase().users,
  getUserById: (id: string) => getDatabase().users.find(u => u.id === id),
  getUserByEmail: (email: string) => getDatabase().users.find(u => u.email.toLowerCase() === email.toLowerCase()),
  
  createUser: (user: DBUser) => {
    const data = getDatabase();
    data.users.push(user);
    saveDatabase(data);
    return user;
  },

  updateUser: (id: string, updates: Partial<DBUser>) => {
    const data = getDatabase();
    const index = data.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    data.users[index] = { ...data.users[index], ...updates };
    saveDatabase(data);
    return data.users[index];
  },

  deleteUser: (id: string) => {
    const data = getDatabase();
    data.users = data.users.filter(u => u.id !== id);
    data.attendanceLogs = data.attendanceLogs.filter(l => l.userId !== id);
    saveDatabase(data);
    return true;
  },

  getAttendanceLogs: () => getDatabase().attendanceLogs,
  
  getTodayLogForUser: (userId: string, date = getTodayDateString()) => {
    return getDatabase().attendanceLogs.find(l => l.userId === userId && l.date === date);
  },

  addAttendanceLog: (log: AttendanceLog) => {
    const data = getDatabase();
    data.attendanceLogs.unshift(log);
    saveDatabase(data);
    return log;
  },

  updateAttendanceLog: (id: string, updates: Partial<AttendanceLog>) => {
    const data = getDatabase();
    const index = data.attendanceLogs.findIndex(l => l.id === id);
    if (index === -1) return null;
    data.attendanceLogs[index] = { ...data.attendanceLogs[index], ...updates };
    saveDatabase(data);
    return data.attendanceLogs[index];
  },

  deleteAttendanceLog: (id: string) => {
    const data = getDatabase();
    data.attendanceLogs = data.attendanceLogs.filter(l => l.id !== id);
    saveDatabase(data);
    return true;
  },

  resetAndSeed: () => {
    try {
      if (fs.existsSync(DB_FILE)) {
        fs.unlinkSync(DB_FILE);
      }
    } catch {
      // ignore unlink error in serverless environment
    }
    dbCache = null;
    return initializeDatabase();
  }
};