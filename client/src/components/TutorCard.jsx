import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Calendar, BookOpen, Clock, CheckCircle2 } from 'lucide-react';

export default function TutorCard({ tutor, onBookSession }) {
  const { currentUser } = useAuth();
  const isSelf = currentUser && String(currentUser.id) === String(tutor.userId);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
      <div>
        {/* Top Header: Avatar + Info + Rate */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <img
              src={tutor.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=David'}
              alt={tutor.name}
              className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 object-cover shadow-inner"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition text-base sm:text-lg">
                  {tutor.name}
                </h3>
                {isSelf && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    You
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">{tutor.email}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block text-lg font-extrabold text-indigo-600">
              {Number(tutor.hourlyRate) === 0 ? 'Free' : `$${tutor.hourlyRate}`}
            </span>
            <span className="block text-[11px] text-slate-400 font-medium">/ session</span>
          </div>
        </div>

        {/* Headline */}
        <p className="mt-3.5 text-sm font-semibold text-slate-700 leading-snug">
          {tutor.headline}
        </p>

        {/* Bio */}
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500 line-clamp-3 leading-relaxed">
          {tutor.bio}
        </p>

        {/* Subjects Taught */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span>Subjects Taught:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tutor.subjects && tutor.subjects.length > 0 ? (
              tutor.subjects.map((sub) => (
                <span
                  key={sub.id}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200/60"
                >
                  {sub.name}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">No specific subjects listed</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-1 text-xs text-emerald-600 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Available for peer requests</span>
        </div>

        {isSelf ? (
          <button
            disabled
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed"
          >
            Your Profile
          </button>
        ) : (
          <button
            onClick={() => onBookSession(tutor)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white transition shadow-sm shadow-indigo-200"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Request Session</span>
          </button>
        )}
      </div>
    </div>
  );
}
