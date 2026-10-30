export type ToolType = 
  | 'merge' 
  | 'organize' 
  | 'split' 
  | 'sign' 
  | 'images-to-pdf' 
  | 'image-converter'
  | 'pdf-to-images';

export interface PdfFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount?: number;
  previewUrl?: string;
}

export interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
}

export type ImageFormat = 'jpg' | 'png' | 'webp' | 'avif' | 'bmp' | 'ico';

export interface ImageConversionItem {
  id: string;
  file: File;
  name: string;
  originalFormat: string;
  size: number;
  previewUrl: string;
  targetFormat: ImageFormat;
  status: 'pending' | 'processing' | 'done' | 'error';
  convertedBlob?: Blob;
  convertedUrl?: string;
  convertedSize?: number;
  error?: string;
}
