import type React from 'react';
import { Files, Layers, Scissors, PenTool, Image as ImageIcon, Sparkles, FileImage } from 'lucide-react';
import type { ToolType } from '../../types';

export interface ToolDefinition {
  id: ToolType;
  translationKey: string;
  icon: React.ElementType;
  colorClass: string;
}

export const TOOLS: ToolDefinition[] = [
  {
    id: 'merge',
    translationKey: 'tools.merge.shortLabel',
    icon: Files,
    colorClass: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'organize',
    translationKey: 'tools.organize.shortLabel',
    icon: Layers,
    colorClass: 'from-amber-500 to-orange-600',
  },
  {
    id: 'split',
    translationKey: 'tools.split.shortLabel',
    icon: Scissors,
    colorClass: 'from-purple-500 to-pink-600',
  },
  {
    id: 'sign',
    translationKey: 'tools.sign.shortLabel',
    icon: PenTool,
    colorClass: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'image-converter',
    translationKey: 'tools.imageConverter.shortLabel',
    icon: Sparkles,
    colorClass: 'from-violet-600 to-indigo-600',
  },
  {
    id: 'images-to-pdf',
    translationKey: 'tools.imagesToPdf.shortLabel',
    icon: ImageIcon,
    colorClass: 'from-rose-500 to-red-600',
  },
  {
    id: 'pdf-to-images',
    translationKey: 'tools.pdfToImages.shortLabel',
    icon: FileImage,
    colorClass: 'from-teal-500 to-cyan-600',
  },
];
