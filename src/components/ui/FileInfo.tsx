import React from 'react';
import { FileText } from 'lucide-react';

interface FileInfoProps {
  fileName: string;
  details: string;
  iconClassName: string; // padding and colors of the icon badge
}

/**
 * Selected document name with an icon and a details line (size, pages...)
 */
export const FileInfo: React.FC<FileInfoProps> = ({ fileName, details, iconClassName }) => (
  <div className="flex items-center gap-3">
    <div className={iconClassName}>
      <FileText className="w-5 h-5" />
    </div>
    <div>
      <p className="text-sm font-bold text-slate-800 truncate max-w-xs sm:max-w-md" title={fileName}>
        {fileName}
      </p>
      <p className="text-xs text-slate-400">{details}</p>
    </div>
  </div>
);
