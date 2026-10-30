import '@testing-library/jest-dom/vitest';

// heic2any spawns a Web Worker at import time; jsdom does not implement workers
class WorkerStub {
  onmessage = null;
  postMessage() {}
  terminate() {}
  addEventListener() {}
  removeEventListener() {}
}
if (typeof globalThis.Worker === 'undefined') {
  globalThis.Worker = WorkerStub as unknown as typeof Worker;
}

// i18n reads localStorage, so it is only initialised in DOM test environments
beforeAll(async () => {
  if (typeof window === 'undefined') return;
  const { default: i18n } = await import('../i18n');
  await i18n.changeLanguage('en');
});
