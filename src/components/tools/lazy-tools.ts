import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { ToolType } from '../../types';

/**
 * Wraps a tool module export in React.lazy, so each tool (and its PDF/image libraries)
 * becomes its own chunk, downloaded the first time the tool is shown
 */
function lazyTool<TModule>(
  load: () => Promise<TModule>,
  pick: (module: TModule) => ComponentType
): LazyExoticComponent<ComponentType> {
  return lazy(async () => ({ default: pick(await load()) }));
}

export const LAZY_TOOLS: Record<ToolType, LazyExoticComponent<ComponentType>> = {
  merge: lazyTool(() => import('./merge/MergeTool'), (m) => m.MergeTool),
  organize: lazyTool(() => import('./organize/OrganizeTool'), (m) => m.OrganizeTool),
  split: lazyTool(() => import('./split/SplitTool'), (m) => m.SplitTool),
  sign: lazyTool(() => import('./sign/SignTool'), (m) => m.SignTool),
  'image-converter': lazyTool(() => import('./image-converter/ImageConverterTool'), (m) => m.ImageConverterTool),
  'images-to-pdf': lazyTool(() => import('./images-to-pdf/ImagesToPdfTool'), (m) => m.ImagesToPdfTool),
  'pdf-to-images': lazyTool(() => import('./pdf-to-images/PdfToImagesTool'), (m) => m.PdfToImagesTool),
};
