import React from 'react';
import { Clock, CheckCircle2, XCircle, Ban } from 'lucide-react';

export default function StatusBadge({ status }) {
  switch (status?.toUpperCase()) {
    case 'PENDING':
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>Pending Confirmation</span>
        </span>
      );
    case 'ACCEPTED':
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Session Confirmed</span>
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>Declined</span>
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          <Ban className="w-3.5 h-3.5 text-slate-500" />
          <span>Cancelled</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
          <span>{status}</span>
        </span>
      );
  }
}
