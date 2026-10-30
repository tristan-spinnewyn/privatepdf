import { fireEvent, render, screen } from '@testing-library/react';
import i18n from '../../i18n';
import { Dropzone } from '../../components/ui/Dropzone';
import { imageFile, pdfFile } from './test-utils';

describe('Dropzone', () => {
  it('forwards dropped PDFs only, and a single one when multiple is off', () => {
    const onFilesSelected = vi.fn();
    render(<Dropzone onFilesSelected={onFilesSelected} multiple={false} />);
    const zone = screen.getByText('Drag and drop your PDF files here').parentElement!;

    fireEvent.dragOver(zone);
    expect(screen.getByText('Drop your files now!')).toBeInTheDocument();
    fireEvent.dragLeave(zone);
    expect(screen.getByText('Drag and drop your PDF files here')).toBeInTheDocument();

    fireEvent.drop(zone, { dataTransfer: { files: [imageFile(), pdfFile('a.pdf'), pdfFile('b.pdf')] } });
    expect(onFilesSelected).toHaveBeenCalledWith([expect.objectContaining({ name: 'a.pdf' })]);
  });

  it('shows an inline message instead of a blocking alert when no PDF is selected', () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const onFilesSelected = vi.fn();
    const { container } = render(<Dropzone onFilesSelected={onFilesSelected} />);

    fireEvent.change(container.querySelector('input')!, { target: { files: [imageFile()] } });

    expect(screen.getByRole('alert')).toHaveTextContent('Please select PDF files.');
    expect(alert).not.toHaveBeenCalled();
    expect(onFilesSelected).not.toHaveBeenCalled();
  });

  it('clears the inline message once a PDF is selected', () => {
    const onFilesSelected = vi.fn();
    const { container } = render(<Dropzone onFilesSelected={onFilesSelected} />);
    const input = container.querySelector('input')!;

    fireEvent.change(input, { target: { files: [imageFile()] } });
    fireEvent.change(input, { target: { files: [pdfFile()] } });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onFilesSelected).toHaveBeenCalledTimes(1);
  });

  it('translates the inline message into French', async () => {
    await i18n.changeLanguage('fr');
    try {
      const { container } = render(<Dropzone onFilesSelected={vi.fn()} />);
      fireEvent.change(container.querySelector('input')!, { target: { files: [imageFile()] } });

      expect(screen.getByRole('alert')).toHaveTextContent('Veuillez sélectionner des fichiers au format PDF.');
    } finally {
      await i18n.changeLanguage('en');
    }
  });

  it('accepts any file for image dropzones and shows custom texts', () => {
    const onFilesSelected = vi.fn();
    const { container } = render(
      <Dropzone onFilesSelected={onFilesSelected} accept="image/*" title="Custom title" description="Custom desc" compact />
    );

    expect(screen.getByText('Custom title')).toBeInTheDocument();
    expect(screen.getByText('Custom desc')).toBeInTheDocument();
    fireEvent.change(container.querySelector('input')!, { target: { files: [imageFile('a.png'), imageFile('b.png')] } });

    expect(onFilesSelected).toHaveBeenCalledWith([expect.any(File), expect.any(File)]);
  });

  it('ignores drops without files', () => {
    const onFilesSelected = vi.fn();
    render(<Dropzone onFilesSelected={onFilesSelected} />);
    const zone = screen.getByText('Drag and drop your PDF files here').parentElement!;

    fireEvent.drop(zone, { dataTransfer: { files: [] } });

    expect(onFilesSelected).not.toHaveBeenCalled();
  });
});
