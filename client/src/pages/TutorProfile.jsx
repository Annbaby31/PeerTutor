import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { UserCheck, BookOpen, DollarSign, Check, AlertCircle, Sparkles } from 'lucide-react';

export default function TutorProfile({ onSaved }) {
  const { currentUser, refreshUsers } = useAuth();
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('20.00');
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Fetch all subjects and current user's tutor profile
  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;
      try {
        setLoading(true);
        const [subjectsData, userData] = await Promise.all([
          api.getSubjects(),
          api.getUser(currentUser.id)
        ]);

        setAllSubjects(subjectsData);

        if (userData.tutorProfile) {
          setHeadline(userData.tutorProfile.headline || '');
          setBio(userData.tutorProfile.bio || '');
          setHourlyRate(String(userData.tutorProfile.hourly_rate ?? 20));
          setIsAvailable(Boolean(userData.tutorProfile.is_available));
          if (userData.tutorProfile.subjects) {
            setSelectedSubjectIds(userData.tutorProfile.subjects.map(s => s.id));
          }
        }
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentUser]);

  const toggleSubject = (subId) => {
    setSelectedSubjectIds(prev =>
      prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!headline.trim()) {
      setErrorMsg('Please provide a short headline (e.g. Senior CS TA).');
      return;
    }

    if (!bio.trim()) {
      setErrorMsg('Please describe your background and coaching approach in the bio.');
      return;
    }

    if (selectedSubjectIds.length === 0) {
      setErrorMsg('Please select at least one subject you can teach.');
      return;
    }

    try {
      setSaving(true);
      await api.saveTutorProfile({
        userId: currentUser.id,
        headline: headline.trim(),
        bio: bio.trim(),
        hourlyRate: parseFloat(hourlyRate) || 0,
        isAvailable: isAvailable ? 1 : 0,
        subjectIds: selectedSubjectIds
      });

      setSuccessMsg('Your tutor profile and subject offerings have been updated successfully!');
      await refreshUsers();
      if (onSaved) onSaved();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-slate-500">
        <div className="w-8 h-8 mx-auto border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-medium">Loading tutor profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="mb-6">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2 border border-indigo-100">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tutor Dashboard</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Manage Tutor Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure your teaching topics, hourly compensation rate, and intro for students.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm mb-6 flex items-center space-x-2 animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm mb-6 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* User Identity Display */}
        <div className="flex items-center space-x-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <img
            src={currentUser?.avatar_url}
            alt={currentUser?.name}
            className="w-12 h-12 rounded-xl bg-white border border-slate-200 object-cover"
          />
          <div>
            <h3 className="font-bold text-slate-900">{currentUser?.name}</h3>
            <p className="text-xs text-slate-500">{currentUser?.email}</p>
          </div>
        </div>

        {/* Headline */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Professional Headline
          </label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Senior CS Major & Teaching Assistant with 3+ years experience"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder:text-slate-400"
            required
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            About You & Coaching Approach
          </label>
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Introduce your teaching style, classes you've aced, and how you help students tackle difficult topics..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
            required
          />
        </div>

        {/* Rate & Availability */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Hourly Session Rate ($ USD)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Set 0 for volunteer peer tutoring</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Accepting New Students
            </label>
            <label className="flex items-center space-x-3 p-2.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-700">
                {isAvailable ? 'Available for requests' : 'Currently paused'}
              </span>
            </label>
          </div>
        </div>

        {/* Subjects Taught Picker */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select Subjects You Teach ({selectedSubjectIds.length} selected)
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            {allSubjects.map((subject) => {
              const isChecked = selectedSubjectIds.includes(subject.id);
              return (
                <button
                  type="button"
                  key={subject.id}
                  onClick={() => toggleSubject(subject.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                    isChecked
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{subject.name}</span>
                  {isChecked && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Tutor Profile</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
