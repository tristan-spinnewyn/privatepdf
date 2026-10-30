import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageConverterTool } from '../../components/tools';
import { convertImage } from '../../services/image';
import { downloadBlob, downloadZip } from '../../utils/download';
import { fileInputs, imageFile, selectFiles } from './test-utils';

vi.mock('../../services/image', () => ({
  convertImage: vi.fn(),
  isHeicFile: (file: File) => file.name.endsWith('.heic'),
}));
vi.mock('../../utils/download', () => ({ downloadBlob: vi.fn(), downloadZip: vi.fn() }));
vi.mock('../../utils/confetti', () => ({ fireSuccessConfetti: vi.fn() }));

describe('ImageConverterTool', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
    vi.mocked(convertImage).mockImplementation(async (file, options) => ({
      blob: new Blob(['converted']),
      width: 1,
      height: 1,
      filename: `${file.name}.${options.targetFormat}`,
    }));
  });

  async function addImages() {
    const user = userEvent.setup();
    const { container } = render(<ImageConverterTool />);
    selectFiles(fileInputs(container)[0], [imageFile('a.png'), imageFile('b.heic')]);
    expect(await screen.findByText('HEIC (iOS)')).toBeInTheDocument();
    return { user, container };
  }

  it('converts every image with the chosen settings and offers single and ZIP downloads', async () => {
    const { user } = await addImages();

    await user.click(screen.getByRole('button', { name: 'WEBP' }));
    expect(screen.getByText('Quality:')).toBeInTheDocument();
    await user.selectOptions(screen.getByDisplayValue('100% (Original size)'), '0.5');

    await user.click(screen.getByRole('button', { name: /Convert 2 images/ }));

    expect(await screen.findByText('Conversion finished successfully!')).toBeInTheDocument();
    expect(convertImage).toHaveBeenCalledWith(expect.any(File), {
      targetFormat: 'webp',
      quality: 0.9,
      scale: 0.5,
      icoSize: undefined,
    });

    await user.click(screen.getAllByTitle('Download')[0]);
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'a.png.webp');

    await user.click(screen.getByRole('button', { name: /Download all \(ZIP\)/ }));
    await waitFor(() => expect(downloadZip).toHaveBeenCalledWith(expect.any(Array), 'images_converties.zip'));
  });

  it('shows the icon size option for ICO and per-item format switches', async () => {
    const { user } = await addImages();

    await user.click(screen.getByRole('button', { name: 'ICO' }));
    expect(screen.getByText('Icon size:')).toBeInTheDocument();
    await user.selectOptions(screen.getByDisplayValue('64 × 64 px (HD)'), '32');

    const rows = screen.getAllByRole('listitem');
    await user.selectOptions(within(rows[1]).getByRole('combobox'), 'png');

    await user.click(screen.getByRole('button', { name: /Convert 2 images/ }));
    await screen.findByText('Conversion finished successfully!');

    expect(vi.mocked(convertImage).mock.calls.map(([, options]) => options)).toEqual([
      { targetFormat: 'ico', quality: 0.9, scale: 1, icoSize: 32 },
      { targetFormat: 'png', quality: 0.9, scale: 1, icoSize: undefined },
    ]);
  });

  it('adjusts quality, adds more images, removes one and clears all', async () => {
    const { user, container } = await addImages();

    const slider = screen.getByRole('slider');
    await user.click(slider);
    selectFiles(fileInputs(container)[0], [imageFile('c.png')]);
    expect(await screen.findByText('3 images selected')).toBeInTheDocument();

    await user.click(screen.getAllByTitle('Remove from list')[0]);
    expect(screen.getByText('2 images selected')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(screen.getByText('Drag and drop your images here')).toBeInTheDocument();
  });
});
