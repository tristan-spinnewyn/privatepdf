import confetti from 'canvas-confetti';
import { fireSuccessConfetti } from '../../utils/confetti';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

describe('fireSuccessConfetti', () => {
  it('fires a single confetti burst from the lower part of the screen', () => {
    fireSuccessConfetti();

    expect(confetti).toHaveBeenCalledTimes(1);
    expect(confetti).toHaveBeenCalledWith(expect.objectContaining({ particleCount: 80, origin: { y: 0.65 } }));
  });
});
