/**
 * Returns a copy of the list with the item at `fromIndex` moved to `toIndex`.
 * Returns the original list when `toIndex` is out of bounds.
 */
export function moveItem<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (toIndex < 0 || toIndex >= list.length) return list;

  const copy = [...list];
  const [moved] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, moved);
  return copy;
}
