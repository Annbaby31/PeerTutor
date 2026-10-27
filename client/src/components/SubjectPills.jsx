import React from 'react';
import { BookOpen } from 'lucide-react';

export default function SubjectPills({ subjects, selectedSubjectId, onSelectSubject }) {
  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
      <button
        onClick={() => onSelectSubject(null)}
        className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition whitespace-nowrap flex items-center space-x-1.5 ${
          selectedSubjectId === null
            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <BookOpen className="w-3.5 h-3.5" />
        <span>All Subjects</span>
      </button>

      {subjects.map((sub) => {
        const isSelected = String(selectedSubjectId) === String(sub.id);
        return (
          <button
            key={sub.id}
            onClick={() => onSelectSubject(isSelected ? null : sub.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition whitespace-nowrap ${
              isSelected
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {sub.name}
            {sub.tutor_count !== undefined && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.2 rounded-full ${
                isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {sub.tutor_count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
