import React, { useState, useRef } from 'react';
import { UploadCloud, FileType } from 'lucide-react';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  title?: string;
  description?: string;
  compact?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFilesSelected,
  accept = '.pdf',
  multiple = true,
  title = 'Glissez-déposez vos fichiers ici',
  description = 'ou cliquez pour parcourir votre ordinateur',
  compact = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      filterAndSendFiles(droppedFiles);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      filterAndSendFiles(Array.from(e.target.files));
      e.target.value = ''; // Reset input to allow re-selection of the same file
    }
  };

  const filterAndSendFiles = (files: File[]) => {
    if (accept === '.pdf') {
      const pdfs = files.filter(
        f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      if (pdfs.length > 0) {
        onFilesSelected(multiple ? pdfs : [pdfs[0]]);
      } else {
        alert('Veuillez sélectionner des fichiers au format PDF.');
      }
    } else if (accept.includes('image')) {
      const images = files.filter(f => f.type.startsWith('image/'));
      if (images.length > 0) {
        onFilesSelected(multiple ? images : [images[0]]);
      } else {
        alert('Veuillez sélectionner des fichiers images (JPG, PNG, WebP).');
      }
    } else {
      onFilesSelected(multiple ? files : [files[0]]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`group relative border-2 border-dashed rounded-3xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center select-none ${
        isDragOver
          ? 'border-indigo-500 bg-indigo-50/70 scale-[0.995] shadow-inner'
          : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50/60 shadow-xs'
      } ${compact ? 'p-6' : 'p-10 sm:p-14'}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
      />

      <div
        className={`rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${
          isDragOver
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
            : 'bg-indigo-50 text-indigo-600'
        } ${compact ? 'w-12 h-12 mb-3' : 'w-16 h-16 mb-4'}`}
      >
        {isDragOver ? (
          <UploadCloud className={compact ? 'w-6 h-6 animate-bounce' : 'w-8 h-8 animate-bounce'} />
        ) : (
          <FileType className={compact ? 'w-6 h-6' : 'w-8 h-8'} />
        )}
      </div>

      <h4 className={`font-bold text-slate-800 tracking-tight ${compact ? 'text-base' : 'text-lg sm:text-xl'}`}>
        {isDragOver ? 'Déposez vos fichiers !' : title}
      </h4>

      <p className={`text-slate-500 mt-1 ${compact ? 'text-xs' : 'text-sm'}`}>
        {description}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200/60">
          {accept === '.pdf' ? 'Format PDF accepté' : 'JPG, PNG, WebP'}
        </span>
        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
          Sans limite de taille
        </span>
      </div>
    </div>
  );
};
