import { act, renderHook } from '@testing-library/react';
import { buildOrganizePlan, useOrganizePages } from '../../hooks/useOrganizePages';
import type { PageThumbnailImage } from '../../services/pdf';

const thumbnails: PageThumbnailImage[] = [1, 2, 3].map((pageNumber) => ({
  pageNumber,
  dataUrl: `thumb-${pageNumber}`,
  width: 100,
  height: 150,
}));

describe('useOrganizePages', () => {
  it('builds page items from thumbnails', () => {
    const { result } = renderHook(() => useOrganizePages());

    act(() => result.current.loadPages(thumbnails));

    expect(result.current.pages[1]).toEqual({
      originalIndex: 1,
      pageNumber: 2,
      thumbnailUrl: 'thumb-2',
      rotation: 0,
      isDeleted: false,
      width: 100,
      height: 150,
    });
    expect(result.current.remainingCount).toBe(3);
  });

  it('rotates, deletes and moves pages', () => {
    const { result } = renderHook(() => useOrganizePages());
    act(() => result.current.loadPages(thumbnails));

    act(() => result.current.rotatePage(0, -90));
    expect(result.current.pages[0].rotation).toBe(270);

    act(() => result.current.rotateAll(90));
    expect(result.current.pages.map((p) => p.rotation)).toEqual([0, 90, 90]);

    act(() => result.current.toggleDeletePage(1));
    expect(result.current.remainingCount).toBe(2);

    act(() => result.current.movePage(2, 'left'));
    expect(result.current.pages.map((p) => p.originalIndex)).toEqual([0, 2, 1]);

    act(() => result.current.movePage(0, 'left'));
    expect(result.current.pages.map((p) => p.originalIndex)).toEqual([0, 2, 1]);

    act(() => result.current.clearPages());
    expect(result.current.pages).toEqual([]);
  });
});

describe('buildOrganizePlan', () => {
  it('derives the page order, rotations and deletions', () => {
    const plan = buildOrganizePlan([
      { originalIndex: 2, pageNumber: 3, thumbnailUrl: '', rotation: 90, isDeleted: false, width: 1, height: 1 },
      { originalIndex: 0, pageNumber: 1, thumbnailUrl: '', rotation: 0, isDeleted: true, width: 1, height: 1 },
    ]);

    expect(plan.pageOrder).toEqual([2, 0]);
    expect([...plan.rotations]).toEqual([[2, 90]]);
    expect([...plan.deletedPages]).toEqual([0]);
  });
});
