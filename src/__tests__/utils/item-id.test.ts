import { createItemId } from '../../utils/item-id';

describe('createItemId', () => {
  it('builds a unique id prefixed with the file name', () => {
    const file = new File(['x'], 'scan.pdf');
    const first = createItemId(file);
    const second = createItemId(file);

    expect(first.startsWith('scan.pdf-')).toBe(true);
    expect(first).not.toBe(second);
  });
});
