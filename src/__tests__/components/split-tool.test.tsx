import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SplitTool } from '../../components/tools';
import { releasePdfDocument, renderAllPageThumbnails, splitPdf } from '../../services/pdf';
import { downloadPdf } from '../../utils/download';
import { fileInputs, pdfFile, selectFiles } from './test-utils';

vi.mock('../../services/pdf', () => ({
  splitPdf: vi.fn(),
  renderAllPageThumbnails: vi.fn(),
  releasePdfDocument: vi.fn(),
}));
vi.mock('../../utils/download', () => ({ downloadPdf: vi.fn() }));
vi.mock('../../utils/confetti', () => ({ fireSuccessConfetti: vi.fn() }));

const thumbnails = [1, 2, 3, 4].map((pageNumber) => ({ pageNumber, dataUrl: `t${pageNumber}`, width: 1, height: 1 }));

describe('SplitTool', () => {
  beforeEach(() => {
    vi.mocked(renderAllPageThumbnails).mockResolvedValue(thumbnails);
    vi.mocked(splitPdf).mockResolvedValue(new Uint8Array([3]));
  });

  async function loadDocument() {
    const user = userEvent.setup();
    const { container } = render(<SplitTool />);
    selectFiles(fileInputs(container)[0], [pdfFile('book.pdf')]);
    expect(await screen.findByDisplayValue('1')).toBeInTheDocument();
    return user;
  }

  it('selects the first page by default and extracts the selection', async () => {
    const user = await loadDocument();

    await user.click(screen.getByText('Page 3'));
    expect(screen.getByDisplayValue('1, 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Extract 2 pages/ }));

    await waitFor(() => expect(downloadPdf).toHaveBeenCalledWith(new Uint8Array([3]), 'book_extrait_2pages.pdf'));
    expect(splitPdf).toHaveBeenCalledWith(expect.any(File), [1, 3]);
    expect(screen.getByText('2 page(s) extracted and downloaded!')).toBeInTheDocument();
  });

  it('supports the quick filters and typed ranges', async () => {
    const user = await loadDocument();

    await user.click(screen.getByRole('button', { name: 'Select all' }));
    expect(screen.getByDisplayValue('1-4')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Odd' }));
    expect(screen.getByDisplayValue('1, 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Even' }));
    expect(screen.getByDisplayValue('2, 4')).toBeInTheDocument();

    const rangeInput = screen.getByPlaceholderText('Example: 1-3, 5, 8-10');
    await user.clear(rangeInput);
    await user.type(rangeInput, '2-3');
    expect(screen.getByText('2 / 4 pages selected', { exact: false })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Deselect all' }));
    expect(screen.getByRole('button', { name: /Extract 0 pages/ })).toBeDisabled();
  });

  it('reports load and extraction errors, and lets the user change file', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(splitPdf).mockRejectedValue(new Error('broken'));
    const user = await loadDocument();

    await user.click(screen.getByRole('button', { name: /Extract 1 pages/ }));
    expect(await screen.findByText('An error occurred while extracting the pages.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Change file' }));
    vi.mocked(renderAllPageThumbnails).mockRejectedValue(new Error('unreadable'));
    selectFiles(fileInputs(document.body)[0], [pdfFile('bad.pdf')]);
    expect(await screen.findByText('Could not read the PDF pages.')).toBeInTheDocument();
  });

  it('frees the PDF when the user changes file and when the tool closes', async () => {
    const user = userEvent.setup();
    const { container, unmount } = render(<SplitTool />);
    const open = async (fileName: string) => {
      selectFiles(fileInputs(container)[0], [pdfFile(fileName)]);
      expect(await screen.findByDisplayValue('1')).toBeInTheDocument();
    };

    await open('first.pdf');
    expect(releasePdfDocument).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Change file' }));
    expect(releasePdfDocument).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ name: 'first.pdf' }));

    await open('second.pdf');
    unmount();
    expect(releasePdfDocument).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'second.pdf' }));
  });
});
