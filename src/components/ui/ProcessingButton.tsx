import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProcessingButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isProcessing: boolean;
  icon: React.ReactNode;
  label: string;
  processingLabel: string;
  className: string; // layout and color classes of the specific tool
  spinnerClassName?: string;
}

/**
 * Main action button of a tool, showing a spinner while the action runs
 */
export const ProcessingButton: React.FC<ProcessingButtonProps> = ({
  onClick,
  disabled,
  isProcessing,
  icon,
  label,
  processingLabel,
  className,
  spinnerClassName = 'w-5 h-5',
}) => (
  <button onClick={onClick} disabled={disabled} className={className}>
    {isProcessing ? (
      <>
        <Loader2 className={`${spinnerClassName} animate-spin`} />
        <span>{processingLabel}</span>
      </>
    ) : (
      <>
        {icon}
        <span>{label}</span>
      </>
    )}
  </button>
);
