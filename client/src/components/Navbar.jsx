import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Users, Calendar, UserCheck, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, pendingCount = 0 }) {
  const { users, currentUser, switchUser, isTutor } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('browse')}>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                PeerTutor
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Campus MVP
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('browse')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'browse'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Browse Tutors</span>
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`relative flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'bookings'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Bookings</span>
              {pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'profile'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>{isTutor ? 'Tutor Profile' : 'Become a Tutor'}</span>
            </button>
          </nav>

          {/* Demo Persona Switcher */}
          <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs text-slate-400 font-medium">Demo Persona</span>
              <span className="text-xs font-bold text-slate-700">
                {currentUser?.role === 'STUDENT' ? '🎒 Student View' : '🎓 Tutor View'}
              </span>
            </div>

            <div className="relative flex items-center">
              <img
                src={currentUser?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'}
                alt={currentUser?.name}
                className="w-9 h-9 rounded-full ring-2 ring-indigo-500/20 bg-slate-100 object-cover mr-2"
              />
              <select
                value={currentUser?.id || ''}
                onChange={(e) => switchUser(e.target.value)}
                className="text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                title="Switch demo persona to test student and tutor experiences"
              >
                <optgroup label="— Students —">
                  {users
                    .filter((u) => u.role === 'STUDENT')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (Student)
                      </option>
                    ))}
                </optgroup>
                <optgroup label="— Tutors —">
                  {users
                    .filter((u) => u.role === 'TUTOR' || u.role === 'BOTH')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (Tutor)
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
