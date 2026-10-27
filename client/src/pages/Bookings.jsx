import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { Calendar, Clock, User, Check, X, Ban, RefreshCw, AlertCircle, BookOpen } from 'lucide-react';

export default function Bookings({ onNavigateBrowse }) {
  const { currentUser, isTutor } = useAuth();
  
  // Default to tutor tab if current user is a tutor, else student tab
  const [activeSubTab, setActiveSubTab] = useState(
    currentUser?.role === 'TUTOR' ? 'tutor' : 'student'
  );
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Sync subtab if user switched persona
  useEffect(() => {
    if (currentUser?.role === 'TUTOR') {
      setActiveSubTab('tutor');
    } else {
      setActiveSubTab('student');
    }
  }, [currentUser]);

  const loadSessions = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSessions({
        userId: currentUser.id,
        asRole: activeSubTab
      });
      setSessions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [currentUser, activeSubTab]);

  const handleStatusChange = async (sessionId, newStatus) => {
    try {
      setUpdatingId(sessionId);
      const updated = await api.updateSessionStatus(sessionId, newStatus, currentUser.id);
      
      // Update local state smoothly
      setSessions(prev =>
        prev.map(s => (s.id === sessionId ? updated : s))
      );
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = sessions.filter(s => s.status === 'PENDING').length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Session Bookings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track and manage your upcoming 1-on-1 peer learning appointments.
          </p>
        </div>

        <button
          onClick={loadSessions}
          className="self-start sm:self-auto flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Persona Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 mb-6">
        <button
          onClick={() => setActiveSubTab('student')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeSubTab === 'student'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>My Requests (as Student)</span>
          {activeSubTab === 'student' && sessions.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-500 text-white text-[10px]">
              {sessions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('tutor')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeSubTab === 'tutor'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>Incoming Requests (as Tutor)</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold animate-pulse">
              {pendingCount} Pending
            </span>
          )}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm mb-6 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Error loading sessions: {error}</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-10 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          title={
            activeSubTab === 'student'
              ? "You haven't requested any tutoring sessions yet"
              : "No incoming tutoring requests yet"
          }
          message={
            activeSubTab === 'student'
              ? "Explore the peer tutor directory and book a session to get help with your coursework."
              : "When students book sessions for subjects you teach, they will appear here for you to accept or decline."
          }
          actionText={activeSubTab === 'student' ? 'Browse Available Tutors' : null}
          onAction={onNavigateBrowse}
        />
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const isStudentView = activeSubTab === 'student';
            const partner = isStudentView ? session.tutor : session.student;
            const isPending = session.status === 'PENDING';
            const isUpdating = updatingId === session.id;

            return (
              <div
                key={session.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Left: Info */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={session.status} />
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      <BookOpen className="w-3 h-3" />
                      <span>{session.subject.name}</span>
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Session #{session.id}
                    </span>
                  </div>

                  {/* Partner details */}
                  <div className="flex items-center space-x-3">
                    <img
                      src={partner.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'}
                      alt={partner.name}
                      className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 object-cover"
                    />
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                        {isStudentView ? 'Tutor' : 'Student'}
                      </p>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        {partner.name}
                      </h4>
                      <p className="text-xs text-slate-500">{partner.email}</p>
                    </div>
                  </div>

                  {/* Date, Time & Notes */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                    <div className="flex items-center space-x-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{session.scheduledAt}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{session.durationMinutes} mins</span>
                    </div>
                  </div>

                  {session.notes && (
                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100 italic">
                      &ldquo;{session.notes}&rdquo;
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex md:flex-col items-center justify-end gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* Tutor Actions */}
                  {!isStudentView && isPending && (
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleStatusChange(session.id, 'ACCEPTED')}
                        disabled={isUpdating}
                        className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm shadow-emerald-200 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>

                      <button
                        onClick={() => handleStatusChange(session.id, 'REJECTED')}
                        disabled={isUpdating}
                        className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  )}

                  {/* Student Actions */}
                  {isStudentView && isPending && (
                    <button
                      onClick={() => handleStatusChange(session.id, 'CANCELLED')}
                      disabled={isUpdating}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 transition disabled:opacity-50"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Cancel Request</span>
                    </button>
                  )}

                  {/* Confirmed State Info */}
                  {session.status === 'ACCEPTED' && (
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-600 block">Ready for session</span>
                      <span className="text-[11px] text-slate-400">Join link will activate at scheduled time</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
