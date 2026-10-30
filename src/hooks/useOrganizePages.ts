import { useState } from 'react';
import type { PageThumbnailImage } from '../services/pdf';
import { moveItem } from '../utils/array';

export interface OrganizePageItem {
  originalIndex: number; // 0-indexed
  pageNumber: number; // 1-indexed display
  thumbnailUrl: string;
  rotation: number; // 0, 90, 180, 270
  isDeleted: boolean;
  width: number;
  height: number;
}

export interface OrganizePlan {
  pageOrder: number[];
  rotations: Map<number, number>;
  deletedPages: Set<number>;
}

const normalizeRotation = (rotation: number) => (rotation + 360) % 360;

/**
 * Converts the edited page list into the arguments expected by organizePdf
 */
export function buildOrganizePlan(pages: OrganizePageItem[]): OrganizePlan {
  const rotations = new Map<number, number>();
  const deletedPages = new Set<number>();

  pages.forEach((p) => {
    if (p.rotation !== 0) rotations.set(p.originalIndex, p.rotation);
    if (p.isDeleted) deletedPages.add(p.originalIndex);
  });

  return { pageOrder: pages.map((p) => p.originalIndex), rotations, deletedPages };
}

/**
 * Page order, rotation and deletion state of the Organize tool
 */
export function useOrganizePages() {
  const [pages, setPages] = useState<OrganizePageItem[]>([]);

  const loadPages = (thumbnails: PageThumbnailImage[]) => {
    setPages(
      thumbnails.map((thumb) => ({
        originalIndex: thumb.pageNumber - 1,
        pageNumber: thumb.pageNumber,
        thumbnailUrl: thumb.dataUrl,
        rotation: 0,
        isDeleted: false,
        width: thumb.width,
        height: thumb.height,
      }))
    );
  };

  const clearPages = () => setPages([]);

  const rotatePage = (index: number, delta: number) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, rotation: normalizeRotation(p.rotation + delta) } : p))
    );
  };

  const rotateAll = (delta: number) => {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: normalizeRotation(p.rotation + delta) })));
  };

  const toggleDeletePage = (index: number) => {
    setPages((prev) => prev.map((p, i) => (i === index ? { ...p, isDeleted: !p.isDeleted } : p)));
  };

  const movePage = (fromIndex: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    setPages((prev) => moveItem(prev, fromIndex, toIndex));
  };

  const remainingCount = pages.filter((p) => !p.isDeleted).length;

  return { pages, remainingCount, loadPages, clearPages, rotatePage, rotateAll, toggleDeletePage, movePage };
}
