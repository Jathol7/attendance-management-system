import React, { useState } from 'react';
import { api } from '../../services/api';
import { AvatarImagePicker } from '../common/AvatarImagePicker';
import { X, UserPlus, Mail, Lock, Building, Briefcase, Shield, KeyRound, AlertCircle } from 'lucide-react';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEPARTMENTS = [
  'Software Engineering',
  'Product & Design',
  'Human Resources',
  'Marketing & Sales',
  'Executive Operations',
  'Customer Support',
  'Finance & Legal',
];

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Software Engineering');
  const [jobTitle, setJobTitle] = useState('');
  const [role, setRole] = useState<'employee' | 'admin'>('employee');
  const [temporaryPassword, setTemporaryPassword] = useState('Welcome@2026');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !temporaryPassword) {
      setError('Name, email, and temporary password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createEmployee({
        name,
        email,
        department,
        role,
        temporaryPassword,
        jobTitle,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      onSuccess();
      onClose();
      // Reset
      setName('');
      setEmail('');
      setJobTitle('');
      setTemporaryPassword('Welcome@2026');
      setAvatarUrl('');
    } catch (err: any) {
      setError(err.message || 'Failed to create employee.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add New Employee</h3>
              <p className="text-xs text-slate-500">Employee will be issued a temporary onboarding password</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Employee Avatar / Image Picker */}
          <AvatarImagePicker
            currentAvatarUrl={avatarUrl}
            userName={name || 'New Employee'}
            onChange={(url) => setAvatarUrl(url)}
          />

          <div>
            <label className="block font-semibold text-slate-700 mb-1" htmlFor="emp-add-name">
              Full Legal Name
            </label>
            <input
              id="emp-add-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rachel Adams"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1" htmlFor="emp-add-email">
              Work Email Address
            </label>
            <input
              id="emp-add-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rachel.adams@company.com"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1" htmlFor="emp-add-dept">
                Department
              </label>
              <select
                id="emp-add-dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1" htmlFor="emp-add-role">
                System Role
              </label>
              <select
                id="emp-add-role"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="employee">Standard Employee</option>
                <option value="admin">Administrator (Full Access)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1" htmlFor="emp-add-jobtitle">
              Job Title / Designation
            </label>
            <input
              id="emp-add-jobtitle"
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1" htmlFor="emp-add-temppass">
              Temporary Initial Password
            </label>
            <div className="relative">
              <input
                id="emp-add-temppass"
                type="text"
                required
                value={temporaryPassword}
                onChange={(e) => setTemporaryPassword(e.target.value)}
                placeholder="e.g. Welcome@2026"
                className="w-full pl-3.5 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
            <strong>Security Enforcement:</strong> On the employee's initial login using these temporary credentials, the system will automatically require them to establish their own private password.
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-add-emp-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Register Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
