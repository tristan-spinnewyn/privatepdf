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

export interface PageThumbnail {
  pageNumber: number; // 1-indexed original page
  rotation: number; // 0, 90, 180, 270 degrees
  dataUrl?: string;
  width: number;
  height: number;
  isDeleted?: boolean;
}

export interface SignatureSettings {
  penColor: string;
  strokeWidth: number;
  includeDate: boolean;
  dateText: string;
  includeTextName: boolean;
  signerName: string;
}

export interface SignaturePlacement {
  pageNumber: number;
  xPercent: number; // 0 to 100
  yPercent: number; // 0 to 100
  widthPercent: number; // 0 to 100
  heightPercent: number; // 0 to 100
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
