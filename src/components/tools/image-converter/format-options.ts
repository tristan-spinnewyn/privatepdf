import type { ImageFormat } from '../../../types';

export const FORMAT_OPTIONS: { id: ImageFormat; label: string; desc: string }[] = [
  { id: 'jpg', label: 'JPG', desc: 'Photos & compression standard' },
  { id: 'png', label: 'PNG', desc: 'Sans perte & transparence' },
  { id: 'webp', label: 'WEBP', desc: 'Format web ultra-léger' },
  { id: 'avif', label: 'AVIF', desc: 'Next-gen haute efficacité' },
  { id: 'ico', label: 'ICO', desc: 'Favicon & icônes' },
  { id: 'bmp', label: 'BMP', desc: 'Bitmap brut sans compression' },
];

export const ICO_SIZE_OPTIONS = [
  { size: 16, label: '16 × 16 px (Favicon)' },
  { size: 32, label: '32 × 32 px (Favicon)' },
  { size: 48, label: '48 × 48 px (Windows)' },
  { size: 64, label: '64 × 64 px (HD)' },
  { size: 128, label: '128 × 128 px (Large)' },
  { size: 256, label: '256 × 256 px (Ultra)' },
];

export const LOSSY_FORMATS: ImageFormat[] = ['jpg', 'webp', 'avif'];
