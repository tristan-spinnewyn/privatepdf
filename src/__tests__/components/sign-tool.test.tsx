import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignTool } from '../../components/tools';
import { getPdfPageCount, releasePdfDocument, renderPageToCanvas, signAndDatePdf } from '../../services/pdf';
import { downloadPdf } from '../../utils/download';
import { fileInputs, imageFile, pdfFile, selectFiles } from './test-utils';

vi.mock('../../services/pdf', () => ({
  getPdfPageCount: vi.fn(),
  renderPageToCanvas: vi.fn(),
  signAndDatePdf: vi.fn(),
  releasePdfDocument: vi.fn(),
}));
vi.mock('../../utils/download', () => ({ downloadPdf: vi.fn() }));
vi.mock('../../utils/confetti', () => ({ fireSuccessConfetti: vi.fn() }));

describe('SignTool', () => {
  beforeEach(() => {
    vi.mocked(getPdfPageCount).mockResolvedValue(2);
    vi.mocked(renderPageToCanvas).mockResolvedValue({ width: 700, height: 900 });
    vi.mocked(signAndDatePdf).mockResolvedValue(new Uint8Array([5]));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,SIG');
    HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function loadDocument() {
    const user = userEvent.setup();
    const { container } = render(<SignTool />);
    selectFiles(fileInputs(container)[0], [pdfFile('contract.pdf')]);
    expect(await screen.findByText('1 / 2')).toBeInTheDocument();
    return { user, container };
  }

  function drawSignature(container: HTMLElement) {
    const pad = container.querySelector('canvas.cursor-crosshair')!;
    fireEvent.pointerDown(pad, { clientX: 5, clientY: 5, pointerId: 1 });
    fireEvent.pointerMove(pad, { clientX: 50, clientY: 20, pointerId: 1 });
    fireEvent.pointerUp(pad, { pointerId: 1 });
  }

  it('signs the current page with the drawn signature and the date', async () => {
    const { user, container } = await loadDocument();

    await user.click(screen.getByTitle('Next page'));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    await waitFor(() => expect(renderPageToCanvas).toHaveBeenLastCalledWith(expect.any(File), 2, expect.any(HTMLCanvasElement), 700));

    await user.click(screen.getByTitle('Noir / Black'));
    await user.click(screen.getByRole('button', { name: 'Thick' }));
    drawSignature(container);
    expect(await screen.findByAltText('Signature')).toBeInTheDocument();

    const dateInput = screen.getByPlaceholderText('19/09/2026');
    await user.clear(dateInput);
    await user.type(dateInput, '30/10/2026');
    fireEvent.change(screen.getByRole('slider'), { target: { value: '40' } });

    await user.click(screen.getByRole('button', { name: /Apply & Download signed PDF/ }));

    await waitFor(() => expect(downloadPdf).toHaveBeenCalledWith(new Uint8Array([5]), 'contract_signe.pdf'));
    expect(signAndDatePdf).toHaveBeenCalledWith(
      expect.any(File),
      2,
      'data:image/png;base64,SIG',
      { xPercent: 60, yPercent: 75, widthPercent: 40, heightPercent: 18 },
      { text: '30/10/2026', xPercent: 60, yPercent: 71 }
    );
    expect(screen.getByText('Your document has been signed and downloaded successfully!')).toBeInTheDocument();
  });

  it('signs without a date and with an uploaded signature image', async () => {
    const { user, container } = await loadDocument();

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Upload' }));
    selectFiles(container.querySelector('#signature-upload')!, [imageFile('sig.png')]);
    expect(await screen.findByAltText('Signature')).toBeInTheDocument();

    await user.click(screen.getByTitle('Previous page'));
    await user.click(screen.getByRole('button', { name: /Apply & Download signed PDF/ }));

    await waitFor(() => expect(signAndDatePdf).toHaveBeenCalled());
    const call = vi.mocked(signAndDatePdf).mock.calls[0];
    expect(call[2]).toMatch(/^data:image\/png;base64,/);
    expect(call[4]).toBeUndefined();
  });

  it('clears the drawing and moves overlays by dragging', async () => {
    const { user, container } = await loadDocument();

    drawSignature(container);
    const overlay = (await screen.findByAltText('Signature')).parentElement!;
    fireEvent.mouseDown(overlay, { clientX: 0, clientY: 0 });
    fireEvent.mouseUp(window);
    fireEvent.mouseDown(screen.getByText('Date').parentElement!, { clientX: 0, clientY: 0 });
    fireEvent.mouseUp(window);

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.queryByAltText('Signature')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apply & Download signed PDF/ })).toBeDisabled();
  });

  it('reports open, render and signing errors, and lets the user change file', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(renderPageToCanvas).mockRejectedValue(new Error('render'));
    vi.mocked(signAndDatePdf).mockRejectedValue(new Error('sign'));
    const { user, container } = await loadDocument();
    expect(await screen.findByText(/Rendering error/)).toBeInTheDocument();

    drawSignature(container);
    await user.click(await screen.findByRole('button', { name: /Apply & Download signed PDF/ }));
    expect(await screen.findByText(/Error signing document/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Change file' }));
    vi.mocked(renderPageToCanvas).mockResolvedValue({ width: 700, height: 900 });
    vi.mocked(getPdfPageCount).mockRejectedValue(new Error('open'));
    selectFiles(fileInputs(document.body)[0], [pdfFile('bad.pdf')]);
    expect(await screen.findByText(/Cannot open PDF/)).toBeInTheDocument();
  });

  it('frees the PDF when the user changes file and when the tool closes', async () => {
    const user = userEvent.setup();
    const { container, unmount } = render(<SignTool />);
    const open = async (fileName: string) => {
      selectFiles(fileInputs(container)[0], [pdfFile(fileName)]);
      expect(await screen.findByText('1 / 2')).toBeInTheDocument();
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
