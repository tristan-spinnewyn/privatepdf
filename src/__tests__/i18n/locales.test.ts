import en from '../../i18n/locales/en.json';
import fr from '../../i18n/locales/fr.json';

type Messages = { [key: string]: string | Messages };

function flattenKeys(messages: Messages, prefix = ''): string[] {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : flattenKeys(value, `${prefix}${key}.`)
  );
}

describe('locales', () => {
  it('define the same keys in English and French', () => {
    expect(flattenKeys(fr).sort()).toEqual(flattenKeys(en).sort());
  });

  it.each([
    ['common.errorReadPages', 'Could not read the PDF pages.', 'Impossible de lire les pages du PDF.'],
    ['dropzone.pdfOnly', 'Please select PDF files.', 'Veuillez sélectionner des fichiers au format PDF.'],
    ['tools.merge.error', 'An error occurred while merging the documents.', 'Une erreur est survenue lors de la fusion des documents.'],
    ['tools.sign.errorOpen', 'Could not open this PDF file.', "Impossible d'ouvrir ce fichier PDF."],
    ['tools.imageConverter.error', 'Conversion failed.', 'Échec de la conversion.'],
  ])('translates %s in both languages', (key, english, french) => {
    expect(flattenKeys(en)).toContain(key);
    const lookup = (messages: Messages) =>
      key.split('.').reduce<string | Messages>((node, part) => (node as Messages)[part], messages);
    expect(lookup(en)).toBe(english);
    expect(lookup(fr)).toBe(french);
  });
});
