import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImagesToPdfTool } from '../../components/tools';
import { imagesToPdf } from '../../services/pdf';
import { downloadPdf } from '../../utils/download';
import { fileInputs, imageFile, selectFiles } from './test-utils';

vi.mock('../../services/pdf', () => ({ imagesToPdf: vi.fn() }));
vi.mock('../../utils/download', () => ({ downloadPdf: vi.fn() }));
vi.mock('../../utils/confetti', () => ({ fireSuccessConfetti: vi.fn() }));

describe('ImagesToPdfTool', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
    vi.mocked(imagesToPdf).mockResolvedValue(new Uint8Array([9]));
  });

  async function addImages() {
    const user = userEvent.setup();
    const { container } = render(<ImagesToPdfTool />);
    selectFiles(fileInputs(container)[0], [imageFile('a.png'), imageFile('b.png'), imageFile('c.png')]);
    expect(await screen.findByText('3 image(s) ready to convert to A4 PDF.')).toBeInTheDocument();
    return { user, container };
  }

  it('generates the PDF with the chosen layout, order and name', async () => {
    const { user } = await addImages();

    await user.selectOptions(screen.getByDisplayValue('Auto (based on photo)'), 'landscape');
    await user.selectOptions(screen.getByDisplayValue('Standard margin (recommended)'), 'none');
    await user.click(screen.getAllByTitle('Move right')[0]);
    await user.click(screen.getAllByTitle('Move left')[2]);
    await user.clear(screen.getByPlaceholderText('mes_images.pdf'));
    await user.type(screen.getByPlaceholderText('mes_images.pdf'), 'scans.pdf');

    await user.click(screen.getByRole('button', { name: /Generate & Download PDF/ }));

    await waitFor(() => expect(downloadPdf).toHaveBeenCalledWith(new Uint8Array([9]), 'scans.pdf'));
    const [files, options] = vi.mocked(imagesToPdf).mock.calls[0];
    expect(files.map((f) => f.name)).toEqual(['b.png', 'c.png', 'a.png']);
    expect(options).toEqual({ orientation: 'landscape', margin: 'none' });
    expect(screen.getByText('3 photo(s) converted to A4 PDF successfully!')).toBeInTheDocument();
  });

  it('adds more images, removes one and clears all', async () => {
    const { user, container } = await addImages();

    selectFiles(fileInputs(container)[0], [imageFile('d.png')]);
    expect(await screen.findByText('4 image(s) ready to convert to A4 PDF.')).toBeInTheDocument();

    await user.click(screen.getAllByTitle('Remove from list')[0]);
    expect(URL.revokeObjectURL).toHaveBeenCalled();
    expect(screen.getByText('3 image(s) ready to convert to A4 PDF.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(screen.getByText('Drag and drop your images here')).toBeInTheDocument();
  });

  it('falls back to the default name and reports conversion errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { user } = await addImages();

    await user.clear(screen.getByPlaceholderText('mes_images.pdf'));
    await user.click(screen.getByRole('button', { name: /Generate & Download PDF/ }));
    await waitFor(() => expect(downloadPdf).toHaveBeenCalledWith(expect.anything(), 'mes_images.pdf'));

    vi.mocked(imagesToPdf).mockRejectedValue(new Error('broken'));
    await user.click(screen.getByRole('button', { name: /Generate & Download PDF/ }));
    expect(await screen.findByText(/Error converting images/)).toBeInTheDocument();
  });
});
