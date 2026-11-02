import i18n from '../../i18n';
import { describeProcessingError } from '../../i18n/processing-error-message';
import { EncryptedPdfError } from '../../services/pdf/pdf-errors';
import { ImageTooLargeError } from '../../services/image/image-errors';

const t = i18n.t.bind(i18n);

describe('describeProcessingError', () => {
  it('explains that an encrypted PDF must be unlocked first', () => {
    expect(describeProcessingError(new EncryptedPdfError('secret.pdf'), t, 'fallback')).toBe(
      '"secret.pdf" is password-protected or encrypted. Remove the protection, then try again.'
    );
  });

  it('explains that an image has too many pixels to be processed', () => {
    expect(describeProcessingError(new ImageTooLargeError('huge.png'), t, 'fallback')).toBe(
      '"huge.png" is too large to be processed in the browser (over 100 megapixels).'
    );
  });

  it('uses the fallback message for any other error', () => {
    expect(describeProcessingError(new Error('boom'), t, 'fallback')).toBe('fallback');
    expect(describeProcessingError('boom', t, 'fallback')).toBe('fallback');
  });
});
