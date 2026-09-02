import React, { useState, useEffect } from 'react';
import { User, AttendanceLog } from '../../types';
import { api } from '../../services/api';
import { X, Clock, Edit3, PlusCircle, AlertCircle } from 'lucide-react';

interface ManualLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employees: User[];
  editingLog?: AttendanceLog | null;
}

export const ManualLogModal: React.FC<ManualLogModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employees,
  editingLog,
}) => {
  const [userId, setUserId] = useState('');
  const [date, setDate] = useState('');
  const [checkInTime, setCheckInTime] = useState('09:00:00');
  const [checkOutTime, setCheckOutTime] = useState('17:00:00');
  const [status, setStatus] = useState<'present' | 'checked_out' | 'half_day'>('checked_out');
  const [adminNote, setAdminNote] = useState('');
  const [location, setLocation] = useState('Headquarters Office');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingLog) {
      setUserId(editingLog.userId);
      setDate(editingLog.date);
      setCheckInTime(editingLog.checkInTime || '09:00:00');
      setCheckOutTime(editingLog.checkOutTime || '');
      setStatus((editingLog.status as any) || 'checked_out');
      setAdminNote(editingLog.adminNote || 'Corrected per HR review');
      setLocation(editingLog.location || 'Headquarters Office');
    } else {
      setUserId(employees[0]?.id || '');
      setDate(new Date().toISOString().split('T')[0]);
      setCheckInTime('09:00:00');
      setCheckOutTime('17:00:00');
      setStatus('checked_out');
      setAdminNote('Manual entry authorized by HR Admin');
      setLocation('Headquarters Office');
    }
  }, [editingLog, employees, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date || !checkInTime) {
      setError('Date and Check-In time are required.');
      return;
    }

    if (!adminNote) {
      setError('An administrative audit reason note is required for all manual logs.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingLog && editingLog.id) {
        await api.updateManualLog(editingLog.id, {
          date,
          checkInTime,
          checkOutTime: checkOutTime || undefined,
          status,
          adminNote,
          location,
        });
      } else {
        const targetUserId = (editingLog && editingLog.userId) || userId;
        if (!targetUserId) {
          setError('Please select an employee.');
          setIsSubmitting(false);
          return;
        }
        await api.addManualLog({
          userId: targetUserId,
          date,
          checkInTime,
          checkOutTime: checkOutTime || undefined,
          status,
          adminNote,
          location,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save attendance record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              {editingLog ? <Edit3 className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingLog ? 'Edit Attendance Log (Audit Override)' : 'Add Manual Attendance Log'}
              </h3>
              <p className="text-xs text-slate-500">Record will be flagged with administrative timestamp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
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
          {/* Employee Selector (disabled in edit mode) */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1" htmlFor="manual-emp-select">
              Target Employee
            </label>
            {editingLog ? (
              <div className="px-3.5 py-2.5 bg-slate-100 rounded-xl font-semibold text-slate-800">
                {editingLog.userName} ({editingLog.userEmail})
              </div>
            ) : (
              <select
                id="manual-emp-select"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.department} ({emp.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1" htmlFor="manual-date">
                Attendance Date
              </label>
              <input
                id="manual-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1" htmlFor="manual-status">
                Shift Status
              </label>
              <select
                id="manual-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="checked_out">Checked Out (Completed)</option>
                <option value="present">Present (In Progress)</option>
                <option value="half_day">Half Day (&lt;4h)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1" htmlFor="manual-checkin">
                Check-In Time
              </label>
              <input
                id="manual-checkin"
                type="text"
                placeholder="09:00:00"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1" htmlFor="manual-checkout">
                Check-Out Time (Optional)
              </label>
              <input
                id="manual-checkout"
                type="text"
                placeholder="17:00:00"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1" htmlFor="manual-location">
              Facility / Work Location
            </label>
            <input
              id="manual-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Headquarters Office, Remote VPN"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1" htmlFor="manual-note">
              Audit Reason Note <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="manual-note"
              required
              rows={2}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="State reason for manual adjustment (e.g. Biometric reader offline, Authorized remote overtime)"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
            />
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
              id="submit-manual-log-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingLog ? 'Update Record' : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
