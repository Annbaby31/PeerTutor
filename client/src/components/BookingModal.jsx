import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { X, Calendar, Clock, BookOpen, AlertCircle, Check } from 'lucide-react';

export default function BookingModal({ tutor, onClose, onSuccess }) {
  const { currentUser } = useAuth();

  // Default time: Tomorrow at 14:00 formatted for datetime-local
  const getDefaultDateTime = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(14, 0, 0, 0);
    // Format: YYYY-MM-DDTHH:mm
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [subjectId, setSubjectId] = useState(
    tutor?.subjects && tutor.subjects.length > 0 ? tutor.subjects[0].id : ''
  );
  const [scheduledAt, setScheduledAt] = useState(getDefaultDateTime());
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!tutor) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      setError('Please select an active demo persona first.');
      return;
    }

    if (!subjectId) {
      setError('Please select a subject for the tutoring session.');
      return;
    }

    if (!scheduledAt) {
      setError('Please select a date and time.');
      return;
    }

    // Format scheduledAt cleanly as readable string "YYYY-MM-DD HH:mm"
    const formattedDateTime = scheduledAt.replace('T', ' ');

    try {
      setSubmitting(true);
      const newSession = await api.createSession({
        studentId: currentUser.id,
        tutorId: tutor.userId,
        subjectId: Number(subjectId),
        scheduledAt: formattedDateTime,
        durationMinutes: Number(durationMinutes),
        notes: notes.trim()
      });

      onSuccess(newSession);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
              Request Tutoring Session
            </span>
            <h2 className="text-xl font-bold mt-0.5">Learn with {tutor.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Student Banner */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <img
                src={currentUser?.avatar_url}
                alt={currentUser?.name}
                className="w-7 h-7 rounded-full bg-indigo-100"
              />
              <span className="text-xs text-slate-600">
                Booking as: <strong className="text-slate-900">{currentUser?.name}</strong>
              </span>
            </div>
            <span className="text-xs font-bold text-indigo-600">
              {Number(tutor.hourlyRate) === 0 ? 'Free' : `$${tutor.hourlyRate}/hr`}
            </span>
          </div>

          {/* Subject Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Subject Topic
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              required
            >
              {tutor.subjects && tutor.subjects.length > 0 ? (
                tutor.subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.category})
                  </option>
                ))
              ) : (
                <option value="">No subjects registered</option>
              )}
            </select>
          </div>

          {/* Date & Time and Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Session Date & Time
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes (Standard)</option>
                <option value={90}>90 minutes</option>
              </select>
            </div>
          </div>

          {/* Learning Notes / Goals */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              What would you like to cover?
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Preparing for Tuesday's midterm on trees and graph traversals. Need help with recursion."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 transition disabled:opacity-50 flex items-center space-x-1.5"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Send Request</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
