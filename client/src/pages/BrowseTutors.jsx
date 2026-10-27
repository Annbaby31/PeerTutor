import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import SubjectPills from '../components/SubjectPills';
import TutorCard from '../components/TutorCard';
import EmptyState from '../components/EmptyState';
import { Search, X, Sparkles, Filter, RefreshCw } from 'lucide-react';

export default function BrowseTutors({ onBookSession }) {
  const { currentUser } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load subjects
  useEffect(() => {
    api.getSubjects()
      .then(setSubjects)
      .catch(err => console.error('Failed to load subjects:', err));
  }, []);

  // Load tutors based on subject and search filters
  const loadTutors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTutors({
        subjectId: selectedSubjectId,
        search: searchQuery
      });
      setTutors(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTutors();
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedSubjectId, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold mb-3 border border-indigo-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Connect & Learn Together</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Find the perfect peer tutor for your college courses
          </h1>
          <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
            Get personalized 1-on-1 coaching from peers who have taken your exact classes and mastered the concepts.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by tutor name, bio, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results Summary & Refresh */}
          <div className="flex items-center justify-between sm:justify-end space-x-3 text-xs text-slate-500">
            <span>
              {loading ? 'Refreshing tutors...' : `${tutors.length} peer tutor${tutors.length === 1 ? '' : 's'} available`}
            </span>
            <button
              onClick={loadTutors}
              title="Refresh tutor listings"
              className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Subject Filter Pills */}
        <SubjectPills
          subjects={subjects}
          selectedSubjectId={selectedSubjectId}
          onSelectSubject={setSelectedSubjectId}
        />
      </div>

      {/* Tutors Grid or State Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          Failed to load tutors: {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-slate-200/80 p-6 animate-pulse space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-slate-200 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-4/5" />
              <div className="h-8 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : tutors.length === 0 ? (
        <EmptyState
          title="No peer tutors match your criteria"
          message="Try selecting 'All Subjects' or clearing your search term to see more tutors."
          actionText="Reset Filters"
          onAction={() => {
            setSelectedSubjectId(null);
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutors.map((tutor) => (
            <TutorCard
              key={tutor.id}
              tutor={tutor}
              onBookSession={onBookSession}
            />
          ))}
        </div>
      )}
    </div>
  );
}
