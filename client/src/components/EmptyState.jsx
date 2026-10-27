import React from 'react';
import { SearchX } from 'lucide-react';

export default function EmptyState({ title = 'No results found', message = 'Try tweaking your filters or search terms.', actionText, onAction }) {
  return (
    <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white/50">
      <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        <SearchX className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">{message}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
