import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrganizeTool } from '../../components/tools';
import { organizePdf, releasePdfDocument, renderAllPageThumbnails } from '../../services/pdf';
import { downloadPdf } from '../../utils/download';
import { fileInputs, pdfFile, selectFiles } from './test-utils';

vi.mock('../../services/pdf', () => ({
  organizePdf: vi.fn(),
  renderAllPageThumbnails: vi.fn(),
  releasePdfDocument: vi.fn(),
}));
vi.mock('../../utils/download', () => ({ downloadPdf: vi.fn() }));
vi.mock('../../utils/confetti', () => ({ fireSuccessConfetti: vi.fn() }));

const thumbnails = [1, 2, 3].map((pageNumber) => ({ pageNumber, dataUrl: `thumb-${pageNumber}`, width: 1, height: 1 }));

describe('OrganizeTool', () => {
  beforeEach(() => {
    vi.mocked(renderAllPageThumbnails).mockResolvedValue(thumbnails);
    vi.mocked(organizePdf).mockResolvedValue(new Uint8Array([7]));
  });

  async function loadDocument() {
    const user = userEvent.setup();
    const { container } = render(<OrganizeTool />);
    selectFiles(fileInputs(container)[0], [pdfFile('scan.pdf')]);
    expect(await screen.findByText('3 / 3 pages kept', { exact: false })).toBeInTheDocument();
    return user;
  }

  it('exports the edited page order, rotations and deletions', async () => {
    const user = await loadDocument();

    await user.click(screen.getAllByTitle('Rotate +90°')[0]);
    await user.click(screen.getAllByTitle('Delete page')[1]);
    await user.click(screen.getAllByTitle('Move right')[0]);
    await user.click(screen.getByRole('button', { name: 'All -90°' }));
    await user.click(screen.getByRole('button', { name: 'All +90°' }));
    expect(screen.getByText('2 / 3 pages kept', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('(orig. 2)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Download reorganized PDF/ }));

    await waitFor(() => expect(downloadPdf).toHaveBeenCalledWith(new Uint8Array([7]), 'scan_organise.pdf'));
    const [, order, rotations, deleted] = vi.mocked(organizePdf).mock.calls[0];
    expect(order).toEqual([1, 0, 2]);
    expect([...rotations]).toEqual([[0, 90]]);
    expect([...deleted]).toEqual([1]);
    expect(screen.getByText('Your reorganized document has been generated and downloaded!')).toBeInTheDocument();
  });

  it('restores a deleted page, rotates left, moves back and resets', async () => {
    const user = await loadDocument();

    await user.click(screen.getAllByTitle('Delete page')[0]);
    await user.click(screen.getByText('Restore'));
    await user.click(screen.getAllByTitle('Rotate -90°')[0]);
    expect(screen.getByText('270°')).toBeInTheDocument();
    await user.click(screen.getAllByTitle('Move left')[1]);

    await user.click(screen.getByTitle('Reset'));
    await waitFor(() => expect(screen.queryByText('270°')).not.toBeInTheDocument());
    expect(renderAllPageThumbnails).toHaveBeenCalledTimes(2);
  });

  it('refuses to export when every page is deleted', async () => {
    const user = await loadDocument();

    for (const button of screen.getAllByTitle('Delete page')) {
      await user.click(button);
    }

    expect(screen.getByRole('button', { name: /Download reorganized PDF/ })).toBeDisabled();
  });

  it('reports load and export errors, and lets the user change file', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(organizePdf).mockRejectedValue(new Error('broken'));
    const user = await loadDocument();

    await user.click(screen.getByRole('button', { name: /Download reorganized PDF/ }));
    expect(await screen.findByText(/Error organizing PDF/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Change file' }));
    vi.mocked(renderAllPageThumbnails).mockRejectedValue(new Error('unreadable'));
    selectFiles(fileInputs(document.body)[0], [pdfFile('bad.pdf')]);
    expect(await screen.findByText(/Error reading PDF pages/)).toBeInTheDocument();
  });

  it('frees the PDF when the user changes file and when the tool closes', async () => {
    const user = userEvent.setup();
    const { container, unmount } = render(<OrganizeTool />);
    const open = async (fileName: string) => {
      selectFiles(fileInputs(container)[0], [pdfFile(fileName)]);
      expect(await screen.findByText('3 / 3 pages kept', { exact: false })).toBeInTheDocument();
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
