import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ImageConversionItem, ImageFormat } from '../types';
import { convertImage, isHeicFile } from '../services/image';
import { createItemId } from '../utils/item-id';

export interface ConversionSettings {
  quality: number;
  scale: number;
  icoSize: number;
}

function revokeItemUrls(item: ImageConversionItem) {
  if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
}

function createConversionItem(file: File, targetFormat: ImageFormat): ImageConversionItem {
  const isIos = isHeicFile(file);
  const ext = file.name.split('.').pop()?.toUpperCase() || 'IMG';

  return {
    id: createItemId(file),
    file,
    name: file.name,
    originalFormat: isIos ? 'HEIC (iOS)' : ext,
    size: file.size,
    // Browsers cannot preview HEIC files natively
    previewUrl: isIos ? '' : URL.createObjectURL(file),
    targetFormat,
    status: 'pending',
  };
}

/**
 * List of images queued for format conversion and their conversion status
 */
export function useImageConversionQueue() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ImageConversionItem[]>([]);

  const addFiles = (files: File[], targetFormat: ImageFormat) => {
    setItems((prev) => [...prev, ...files.map((file) => createConversionItem(file, targetFormat))]);
  };

  const setItemFormat = (id: string, format: ImageFormat) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, targetFormat: format, status: 'pending' } : it)));
  };

  const setAllFormats = (format: ImageFormat) => {
    setItems((prev) => prev.map((it) => ({ ...it, targetFormat: format, status: 'pending' })));
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((it) => it.id === id);
      if (item) revokeItemUrls(item);
      return prev.filter((it) => it.id !== id);
    });
  };

  const clearAll = () => {
    items.forEach(revokeItemUrls);
    setItems([]);
  };

  const convertAll = async (settings: ConversionSettings) => {
    const updatedItems = [...items];

    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i];
      try {
        setItems((current) => current.map((it, idx) => (idx === i ? { ...it, status: 'processing' } : it)));

        const result = await convertImage(item.file, {
          targetFormat: item.targetFormat,
          quality: settings.quality,
          scale: settings.scale,
          icoSize: item.targetFormat === 'ico' ? settings.icoSize : undefined,
        });

        updatedItems[i] = {
          ...item,
          status: 'done',
          convertedBlob: result.blob,
          convertedUrl: URL.createObjectURL(result.blob),
          convertedSize: result.blob.size,
          name: result.filename,
        };
      } catch (err: unknown) {
        console.error(err);
        updatedItems[i] = {
          ...item,
          status: 'error',
          error: t('tools.imageConverter.error'),
        };
      }
      setItems([...updatedItems]);
    }
  };

  const doneItems = items.filter((it) => it.status === 'done' && it.convertedBlob);

  return { items, doneItems, addFiles, setItemFormat, setAllFormats, removeItem, clearAll, convertAll };
}
