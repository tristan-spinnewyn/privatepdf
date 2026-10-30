import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PdfToImagesTool } from '../../components/tools';
import {
  convertPdfToImages,
  downloadPdfImagesAsZip,
  releasePdfDocument,
  type PdfPageImage,
} from '../../services/pdf';
import { downloadBlob } from '../../utils/download';
import { fileInputs, pdfFile, selectFiles } from './test-utils';

vi.mock('../../services/pdf', () => ({
  convertPdfToImages: vi.fn(),
  downloadPdfImagesAsZip: vi.fn(),
  releasePdfDocument: vi.fn(),
}));
vi.mock('../../utils/download', () => ({ downloadBlob: vi.fn() }));
vi.mock('../../utils/confetti', () => ({ fireSuccessConfetti: vi.fn() }));

const images: PdfPageImage[] = [1, 2].map((pageNumber) => ({
  pageNumber,
  blob: new Blob(['img']),
  filename: `book_page_${pageNumber}.jpg`,
  dataUrl: `data:${pageNumber}`,
  width: 100,
  height: 150,
}));

describe('PdfToImagesTool', () => {
  beforeEach(() => {
    vi.mocked(convertPdfToImages).mockImplementation(async (_file, options) => {
      options.onProgress?.(1, 2);
      return images;
    });
  });

  async function selectDocument() {
    const user = userEvent.setup();
    const { container } = render(<PdfToImagesTool />);
    expect(screen.getByText('Select the PDF document to convert to images')).toBeInTheDocument();
    selectFiles(fileInputs(container)[0], [pdfFile('book.pdf')]);
    expect(await screen.findByText('book.pdf')).toBeInTheDocument();
    return user;
  }

  it('extracts every page with the chosen format and resolution', async () => {
    const user = await selectDocument();

    await user.selectOptions(screen.getByDisplayValue('PNG (High Fidelity)'), 'jpg');
    await user.selectOptions(screen.getByDisplayValue('High Definition (Recommended)'), '3');
    await user.click(screen.getByRole('button', { name: /Extract all pages to images/ }));

    expect(await screen.findByText('2 page(s) converted to images!')).toBeInTheDocument();
    expect(convertPdfToImages).toHaveBeenCalledWith(expect.any(File), expect.objectContaining({ format: 'jpg', scale: 3 }));

    await user.click(screen.getAllByTitle('Download')[1]);
    expect(downloadBlob).toHaveBeenCalledWith(images[1].blob, 'book_page_2.jpg');

    await user.click(screen.getByRole('button', { name: /Download all pages \(ZIP\)/ }));
    await waitFor(() => expect(downloadPdfImagesAsZip).toHaveBeenCalledWith(images, 'book.pdf'));
  });

  it('reports extraction errors and lets the user change file', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(convertPdfToImages).mockRejectedValue(new Error('broken'));
    const user = await selectDocument();

    await user.click(screen.getByRole('button', { name: /Extract all pages to images/ }));
    expect(
      await screen.findByText('An error occurred while extracting images from the PDF document.')
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Change file' }));
    expect(screen.getByText('Select the PDF document to convert to images')).toBeInTheDocument();
  });

  it('frees the PDF when the user changes file and when the tool closes', async () => {
    const user = userEvent.setup();
    const { container, unmount } = render(<PdfToImagesTool />);
    const open = async (fileName: string) => {
      selectFiles(fileInputs(container)[0], [pdfFile(fileName)]);
      expect(await screen.findByText(fileName)).toBeInTheDocument();
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
