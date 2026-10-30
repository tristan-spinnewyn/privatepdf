import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface FeedbackAlertsProps {
  successMessage: string | null;
  errorMessage: string | null;
}

export const FeedbackAlerts: React.FC<FeedbackAlertsProps> = ({ successMessage, errorMessage }) => (
  <>
    {successMessage && (
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm animate-in fade-in">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <span className="font-medium">{successMessage}</span>
      </div>
    )}

    {errorMessage && (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm animate-in fade-in">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
        <span className="font-medium">{errorMessage}</span>
      </div>
    )}
  </>
);
