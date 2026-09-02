import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AvatarImagePicker } from '../common/AvatarImagePicker';
import {
  Clock,
  Shield,
  User,
  Lock,
  Mail,
  Building,
  Briefcase,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  UserPlus,
  LogIn,
  Info
} from 'lucide-react';
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from '../../types';

const DEPARTMENTS = [
  'Software Engineering',
  'Product & Design',
  'Human Resources',
  'Marketing & Sales',
  'Executive Operations',
  'Customer Support',
  'Finance & Legal',
];

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('admin@company.com');
  const [loginPassword, setLoginPassword] = useState('Admin@123456');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDepartment, setRegDepartment] = useState('Software Engineering');
  const [regJobTitle, setRegJobTitle] = useState('');
  const [regAvatarUrl, setRegAvatarUrl] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      await login({ email: loginEmail, password: loginPassword });
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleQuickLogin = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setLoginError(null);
    login({ email, password: pass }).catch((err) => {
      setLoginError(err.message);
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }

    setIsRegistering(true);
    try {
      const res = await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        department: regDepartment,
        jobTitle: regJobTitle,
        avatarUrl: regAvatarUrl.trim() || undefined,
      });
      setRegSuccess(res.message);
      // Reset form
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegJobTitle('');
      setRegAvatarUrl('');
    } catch (err: any) {
      setRegError(err.message || 'Registration failed.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Header Identity */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-xs mb-3">
          <Clock className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Attendance<span className="text-indigo-600">Hub</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Enterprise Employee Time & Attendance System
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-xs rounded-xl border border-slate-200 sm:px-10">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              id="tab-btn-login"
              onClick={() => {
                setActiveTab('login');
                setLoginError(null);
              }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === 'login'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Employee & Admin Login</span>
            </button>
            <button
              id="tab-btn-register"
              onClick={() => {
                setActiveTab('register');
                setRegError(null);
                setRegSuccess(null);
              }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === 'register'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Self-Registration</span>
            </button>
          </div>

          {/* Tab 1: Login */}
          {activeTab === 'login' && (
            <div>
              {loginError && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="login-email">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. admin@company.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="login-password">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <button
                  id="submit-login-button"
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoggingIn ? 'Verifying Credentials...' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Demo Logins Matrix */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    Quick 1-Click Role Logins
                  </span>
                  <span className="text-[10px] text-slate-400">Preset Seed Accounts</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="quick-login-admin"
                    onClick={() => handleQuickLogin('admin@company.com', 'Admin@123456')}
                    className="p-2.5 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/70 text-left transition-colors flex items-center gap-2.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">Master Admin</div>
                      <div className="text-[10px] text-slate-500 truncate">Full Operations & Logs</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    id="quick-login-lead-dev"
                    onClick={() => handleQuickLogin('sarah.jenkins@company.com', 'Password@123')}
                    className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-left transition-colors flex items-center gap-2.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      SJ
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">Sarah (Active Staff)</div>
                      <div className="text-[10px] text-slate-500 truncate">Engineering Lead</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    id="quick-login-temp-pass"
                    onClick={() => handleQuickLogin('chloe.bennett@company.com', 'Welcome@2026')}
                    className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 text-left transition-colors flex items-center gap-2.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      <KeyRound className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">Chloe (First Login)</div>
                      <div className="text-[10px] text-amber-800 font-medium truncate">Tests Password Reset</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    id="quick-login-pending"
                    onClick={() => handleQuickLogin('julian.vance@company.com', 'Password@123')}
                    className="p-2.5 rounded-lg border border-orange-200 bg-orange-50/50 hover:bg-orange-100/70 text-left transition-colors flex items-center gap-2.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      JV
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">Julian (Pending)</div>
                      <div className="text-[10px] text-orange-800 font-medium truncate">Tests Approval Lock</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Self-Registration */}
          {activeTab === 'register' && (
            <div>
              {regError && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Registration Submitted</span>
                  </div>
                  <p>{regSuccess}</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="mt-2.5 text-xs font-semibold text-emerald-700 underline hover:text-emerald-900"
                  >
                    Switch back to Sign In
                  </button>
                </div>
              )}

              <div className="mb-4 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Approval Policy:</strong> Self-registered employee accounts will be placed in a <strong>Pending Approval</strong> state until verified and activated by an HR Administrator.
                </span>
              </div>

              <form onSubmit={handleRegister} className="space-y-3.5">
                <AvatarImagePicker
                  currentAvatarUrl={regAvatarUrl}
                  userName={regName || 'New Employee'}
                  onChange={(url) => setRegAvatarUrl(url)}
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="reg-name">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      id="reg-name"
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Jordan Miller"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="reg-email">
                    Company Work Email
                  </label>
                  <div className="relative">
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. jordan.miller@company.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="reg-dept">
                      Department
                    </label>
                    <div className="relative">
                      <select
                        id="reg-dept"
                        value={regDepartment}
                        onChange={(e) => setRegDepartment(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
                      >
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                      <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="reg-job-title">
                      Job Title
                    </label>
                    <div className="relative">
                      <input
                        id="reg-job-title"
                        type="text"
                        value={regJobTitle}
                        onChange={(e) => setRegJobTitle(e.target.value)}
                        placeholder="e.g. QA Engineer"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
                      />
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="reg-password">
                    Password (Min. 6 chars)
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <button
                  id="submit-register-button"
                  type="submit"
                  disabled={isRegistering}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {isRegistering ? 'Submitting Registration...' : 'Submit for Admin Approval'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Master Admin Credentials Reference Footer */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>
            Master Admin Account: <code className="bg-slate-200/80 px-1.5 py-0.5 rounded font-mono font-semibold text-slate-700">{DEFAULT_ADMIN_EMAIL}</code> / Password: <code className="bg-slate-200/80 px-1.5 py-0.5 rounded font-mono font-semibold text-slate-700">{DEFAULT_ADMIN_PASSWORD}</code>
          </p>
        </div>
      </div>
    </div>
  );
};
