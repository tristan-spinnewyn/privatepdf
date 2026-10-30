import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n from '../../i18n';
import { MergeTool } from '../../components/tools';
import { getPdfPageCount, mergePdfs } from '../../services/pdf';
import { downloadPdf } from '../../utils/download';
import { fileInputs, pdfFile, selectFiles } from './test-utils';

vi.mock('../../services/pdf', () => ({ mergePdfs: vi.fn(), getPdfPageCount: vi.fn() }));
vi.mock('../../utils/download', () => ({ downloadPdf: vi.fn() }));
vi.mock('../../utils/confetti', () => ({ fireSuccessConfetti: vi.fn() }));

describe('MergeTool', () => {
  beforeEach(() => {
    vi.mocked(getPdfPageCount).mockResolvedValue(3);
    vi.mocked(mergePdfs).mockResolvedValue(new Uint8Array([1]));
  });

  it('lists the added PDFs with their page count and merges them in order', async () => {
    const user = userEvent.setup();
    const { container } = render(<MergeTool />);

    selectFiles(fileInputs(container)[0], [pdfFile('a.pdf'), pdfFile('b.pdf')]);
    expect(await screen.findByText('6 pages total')).toBeInTheDocument();

    await user.click(screen.getAllByTitle('Move down')[0]);
    const merged = vi.mocked(mergePdfs);

    await user.clear(screen.getByPlaceholderText('merged_documents.pdf'));
    await user.click(screen.getByRole('button', { name: /Merge 2 PDFs/ }));

    await waitFor(() => expect(downloadPdf).toHaveBeenCalledWith(new Uint8Array([1]), 'documents_fusionnes.pdf'));
    expect(merged.mock.calls[0][0].map((f) => f.name)).toEqual(['b.pdf', 'a.pdf']);
    expect(screen.getByText('All 2 documents merged and downloaded successfully!')).toBeInTheDocument();
  });

  it('adds more files, removes one and clears the list', async () => {
    const user = userEvent.setup();
    vi.mocked(getPdfPageCount).mockRejectedValue(new Error('unreadable'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(<MergeTool />);

    selectFiles(fileInputs(container)[0], [pdfFile('a.pdf')]);
    expect(await screen.findByText(/1 document selected/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Merge 1 PDFs/ })).toBeDisabled();

    selectFiles(fileInputs(container)[0], [pdfFile('b.pdf')]);
    expect(await screen.findByText(/2 documents selected/)).toBeInTheDocument();

    await user.click(screen.getAllByTitle('Remove from list')[0]);
    expect(screen.queryByText('a.pdf')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(screen.getByText('Drag and drop your PDF files here')).toBeInTheDocument();
  });

  it('shows an error when the merge fails', async () => {
    const user = userEvent.setup();
    vi.mocked(mergePdfs).mockRejectedValue(new Error('broken'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<MergeTool />);

    selectFiles(fileInputs(container)[0], [pdfFile('a.pdf'), pdfFile('b.pdf')]);
    await user.click(await screen.findByRole('button', { name: /Merge 2 PDFs/ }));

    expect(await screen.findByText('An error occurred while merging the documents.')).toBeInTheDocument();
  });

  it('shows the merge error in French', async () => {
    const user = userEvent.setup();
    vi.mocked(mergePdfs).mockRejectedValue(new Error('broken'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await i18n.changeLanguage('fr');
    try {
      const { container } = render(<MergeTool />);

      selectFiles(fileInputs(container)[0], [pdfFile('a.pdf'), pdfFile('b.pdf')]);
      await user.click(await screen.findByRole('button', { name: /Fusionner les 2 PDF/ }));

      expect(await screen.findByText('Une erreur est survenue lors de la fusion des documents.')).toBeInTheDocument();
    } finally {
      await i18n.changeLanguage('en');
    }
  });
});
