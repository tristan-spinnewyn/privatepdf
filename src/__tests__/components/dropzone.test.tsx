import { fireEvent, render, screen } from '@testing-library/react';
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

  it('alerts when no PDF is selected', () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const onFilesSelected = vi.fn();
    const { container } = render(<Dropzone onFilesSelected={onFilesSelected} />);

    fireEvent.change(container.querySelector('input')!, { target: { files: [imageFile()] } });

    expect(alert).toHaveBeenCalled();
    expect(onFilesSelected).not.toHaveBeenCalled();
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
