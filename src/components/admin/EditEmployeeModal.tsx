import React, { useState, useEffect } from 'react';
import { User, UserRole, UserStatus } from '../../types';
import { api } from '../../services/api';
import { AvatarImagePicker } from '../common/AvatarImagePicker';
import { X, UserCheck, AlertCircle, Building2, Briefcase, Mail, Shield, MapPin, Phone, Trash2 } from 'lucide-react';

const DEPARTMENTS = [
  'Software Engineering',
  'Marketing & Sales',
  'Product & Design',
  'Human Resources',
  'Finance & Accounts',
  'Operations',
  'Customer Success',
  'Executive Operations',
];

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: User | null;
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employee,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [jobTitle, setJobTitle] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [status, setStatus] = useState<UserStatus>('active');
  const [location, setLocation] = useState('Headquarters Main Office');
  const [phone, setPhone] = useState('');
  const [shift, setShift] = useState('09:00 AM – 05:00 PM');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (employee) {
      setName(employee.name || '');
      setEmail(employee.email || '');
      setDepartment(employee.department || DEPARTMENTS[0]);
      setJobTitle(employee.jobTitle || '');
      setRole(employee.role || 'employee');
      setStatus(employee.status || 'active');
      setLocation(employee.location || 'Headquarters Main Office');
      setPhone(employee.phone || '');
      setShift(employee.shift || '09:00 AM – 05:00 PM');
      setAvatarUrl(employee.avatarUrl || '');
      setError(null);
    }
  }, [employee, isOpen]);

  if (!isOpen || !employee) return null;

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to PERMANENTLY delete "${employee.name}" (${employee.email})?\n\nThis will remove their employee account and all attendance history permanently. This action cannot be undone.`
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      await api.deleteEmployee(employee.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete employee account.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Employee name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Work email address is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.updateEmployee(employee.id, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        department,
        jobTitle: jobTitle.trim(),
        role,
        status,
        location: location.trim(),
        phone: phone.trim(),
        shift: shift.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update employee details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Edit Employee Profile</h3>
              <p className="text-xs text-slate-500">Update staff details, photo, department, or role</p>
            </div>
          </div>
          <button
            id="close-edit-employee-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Employee Avatar / Image Picker */}
          <AvatarImagePicker
            currentAvatarUrl={avatarUrl}
            userName={name || employee.name}
            onChange={(url) => setAvatarUrl(url)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1" htmlFor="edit-emp-name">
                Full Name *
              </label>
              <input
                id="edit-emp-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Eleanor Vance"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1" htmlFor="edit-emp-email">
                Work Email Address *
              </label>
              <div className="relative">
                <input
                  id="edit-emp-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1" htmlFor="edit-emp-dept">
                Department
              </label>
              <select
                id="edit-emp-dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1" htmlFor="edit-emp-title">
                Job Title
              </label>
              <div className="relative">
                <input
                  id="edit-emp-title"
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1" htmlFor="edit-emp-role">
                System Role
              </label>
              <select
                id="edit-emp-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="employee">Staff Employee (Portal Access)</option>
                <option value="admin">Master Administrator (Full Access)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1" htmlFor="edit-emp-status">
                Account Status
              </label>
              <select
                id="edit-emp-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">Active Staff (Allowed to Punch)</option>
                <option value="pending">Pending Admin Approval</option>
                <option value="disabled">Deactivated / Suspended</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1" htmlFor="edit-emp-location">
                Assigned Facility / Office
              </label>
              <div className="relative">
                <input
                  id="edit-emp-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Headquarters Main Office"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1" htmlFor="edit-emp-phone">
                Contact Phone
              </label>
              <div className="relative">
                <input
                  id="edit-emp-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2.5">
            <button
              id="modal-delete-employee-btn"
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
              className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Deleting...' : 'Delete Account'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                id="save-edit-employee-btn"
                type="submit"
                disabled={isSubmitting || isDeleting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                {isSubmitting ? 'Saving Changes...' : 'Save Employee Details'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
