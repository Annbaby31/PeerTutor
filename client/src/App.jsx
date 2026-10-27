import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import BrowseTutors from './pages/BrowseTutors';
import Bookings from './pages/Bookings';
import TutorProfile from './pages/TutorProfile';
import BookingModal from './components/BookingModal';
import { api } from './api/client';
import { CheckCircle2, X } from 'lucide-react';

function MainApp() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedTutorForBooking, setSelectedTutorForBooking] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Poll or refresh pending requests count for the active user
  const checkPendingCount = async () => {
    if (!currentUser) return;
    try {
      const sessions = await api.getSessions({
        userId: currentUser.id,
        asRole: currentUser.role === 'TUTOR' ? 'tutor' : 'all',
        status: 'PENDING'
      });
      setPendingCount(sessions.length);
    } catch {
      // Ignore background poll errors
    }
  };

  useEffect(() => {
    checkPendingCount();
    const interval = setInterval(checkPendingCount, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const handleBookingSuccess = (newSession) => {
    setSelectedTutorForBooking(null);
    setActiveTab('bookings');
    showToast(`Session request sent to ${newSession.tutor.name}! Check status below.`);
    checkPendingCount();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-3 text-xs sm:text-sm border border-slate-700">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="font-medium">{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Pages */}
      <main className="flex-1">
        {activeTab === 'browse' && (
          <BrowseTutors
            onBookSession={(tutor) => setSelectedTutorForBooking(tutor)}
          />
        )}

        {activeTab === 'bookings' && (
          <Bookings
            onNavigateBrowse={() => setActiveTab('browse')}
          />
        )}

        {activeTab === 'profile' && (
          <TutorProfile
            onSaved={() => {
              showToast('Tutor profile saved! Your listings are updated in the directory.');
            }}
          />
        )}
      </main>

      {/* Session Booking Modal */}
      {selectedTutorForBooking && (
        <BookingModal
          tutor={selectedTutorForBooking}
          onClose={() => setSelectedTutorForBooking(null)}
          onSuccess={handleBookingSuccess}
        />
      )}

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>🎓 Online Peer Tutor Platform &mdash; College Hackathon MVP Project</p>
          <p className="text-slate-400">
            Switch demo personas in the header to simulate both Student and Tutor roles.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
