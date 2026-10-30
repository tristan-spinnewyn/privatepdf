import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n from '../../i18n';
import { App } from '../../App';
import { Navbar } from '../../components/layout/Navbar';

// Each tool module is loaded on demand: mock them one by one
vi.mock('../../components/tools/merge/MergeTool', () => ({ MergeTool: () => <div>merge tool</div> }));
vi.mock('../../components/tools/organize/OrganizeTool', () => ({ OrganizeTool: () => <div>organize tool</div> }));
vi.mock('../../components/tools/split/SplitTool', () => ({ SplitTool: () => <div>split tool</div> }));
vi.mock('../../components/tools/sign/SignTool', () => ({ SignTool: () => <div>sign tool</div> }));
vi.mock('../../components/tools/image-converter/ImageConverterTool', () => ({
  ImageConverterTool: () => <div>image converter tool</div>,
}));
vi.mock('../../components/tools/images-to-pdf/ImagesToPdfTool', () => ({
  ImagesToPdfTool: () => <div>images to pdf tool</div>,
}));
vi.mock('../../components/tools/pdf-to-images/PdfToImagesTool', () => ({
  PdfToImagesTool: () => <div>pdf to images tool</div>,
}));

describe('App', () => {
  it('shows a loader while the merge tool loads, then switches tools from the navigation', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText('Loading tool...')).toBeInTheDocument();
    expect(await screen.findByText('merge tool')).toBeInTheDocument();

    const expectations: [string, string][] = [
      ['Organize', 'organize tool'],
      ['Split', 'split tool'],
      ['Sign', 'sign tool'],
      ['Convert Image', 'image converter tool'],
      ['Images -> PDF', 'images to pdf tool'],
      ['PDF -> Images', 'pdf to images tool'],
      ['Merge', 'merge tool'],
    ];
    for (const [label, content] of expectations) {
      await user.click(screen.getByRole('button', { name: label }));
      expect(await screen.findByText(content)).toBeInTheDocument();
    }
  });
});

describe('Navbar', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('opens and closes the privacy modal', async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(screen.getByRole('button', { name: /100% Offline & Secure/ }));
    expect(screen.getByText('100% Guaranteed Privacy')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Got it' }));
    expect(screen.queryByText('100% Guaranteed Privacy')).not.toBeInTheDocument();
  });

  it('switches the language and remembers it', async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(screen.getByRole('button', { name: 'FR' }));
    expect(localStorage.getItem('app_language')).toBe('fr');
    expect(await screen.findByText('Zéro donnée envoyée', { exact: false })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'EN' }));
    expect(localStorage.getItem('app_language')).toBe('en');
  });
});
