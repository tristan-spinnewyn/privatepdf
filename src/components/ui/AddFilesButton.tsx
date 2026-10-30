import React from 'react';
import { Plus } from 'lucide-react';

interface AddFilesButtonProps {
  label: string;
  accept: string;
  onFilesSelected: (files: File[]) => void;
  className: string;
  iconClassName: string;
}

/**
 * "Add more files" button backed by a hidden multi-file input
 */
export const AddFilesButton: React.FC<AddFilesButtonProps> = ({
  label,
  accept,
  onFilesSelected,
  className,
  iconClassName,
}) => (
  <label className={className}>
    <Plus className={iconClassName} />
    <span>{label}</span>
    <input
      type="file"
      accept={accept}
      multiple
      onChange={(e) => {
        if (e.target.files) onFilesSelected(Array.from(e.target.files));
        e.target.value = '';
      }}
      className="hidden"
    />
  </label>
);
