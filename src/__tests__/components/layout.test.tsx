import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n from '../../i18n';
import { App } from '../../App';
import { Navbar } from '../../components/layout/Navbar';

vi.mock('../../components/tools', () => ({
  MergeTool: () => <div>merge tool</div>,
  OrganizeTool: () => <div>organize tool</div>,
  SplitTool: () => <div>split tool</div>,
  SignTool: () => <div>sign tool</div>,
  ImageConverterTool: () => <div>image converter tool</div>,
  ImagesToPdfTool: () => <div>images to pdf tool</div>,
  PdfToImagesTool: () => <div>pdf to images tool</div>,
}));

describe('App', () => {
  it('shows the merge tool first and switches tools from the navigation', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText('merge tool')).toBeInTheDocument();

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
      expect(screen.getByText(content)).toBeInTheDocument();
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
