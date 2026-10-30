import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { getPdfPageCount, renderPageToCanvas, signAndDatePdf } from '../../../services/pdf';
import { downloadPdf } from '../../../utils/download';
import { fireSuccessConfetti } from '../../../utils/confetti';
import { stripExtension } from '../../../utils/file-name';
import { useToolFeedback } from '../../../hooks/useToolFeedback';
import { useOverlayDrag } from '../../../hooks/useOverlayDrag';
import { useReleasePdfDocument } from '../../../hooks/useReleasePdfDocument';
import { Dropzone } from '../../ui/Dropzone';
import { ToolHeader, HeaderActionButton } from '../../ui/ToolHeader';
import { FeedbackAlerts } from '../../ui/FeedbackAlerts';
import { ProcessingButton } from '../../ui/ProcessingButton';
import { PageNavigator } from './PageNavigator';
import { SignatureCreator } from './SignatureCreator';
import { DateStampOptions } from './DateStampOptions';
import { SignaturePreview } from './SignaturePreview';

const PREVIEW_WIDTH = 700;

function formatToday(language: string): string {
  return new Date().toLocaleDateString(language.startsWith('en') ? 'en-US' : 'fr-FR');
}

export const SignTool: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [includeDate, setIncludeDate] = useState(true);
  // null until the user edits it, so the default follows the current language
  const [editedDateText, setDateText] = useState<string | null>(null);
  const dateText = editedDateText ?? formatToday(i18n.language);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRenderingPage, setIsRenderingPage] = useState(false);
  const { successMessage, errorMessage, showSuccess, showError, resetFeedback } = useToolFeedback();
  useReleasePdfDocument(file);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const { sigPlacement, datePlacement, draggingTarget, startDrag, resizeSignature } =
    useOverlayDrag(previewContainerRef);

  const stampedDate = includeDate && dateText.trim() ? dateText.trim() : null;

  useEffect(() => {
    if (!file || !previewCanvasRef.current) return;

    let isMounted = true;
    setIsRenderingPage(true);

    renderPageToCanvas(file, currentPage, previewCanvasRef.current, PREVIEW_WIDTH)
      .catch((err: unknown) => {
        if (isMounted) {
          console.error(err);
          showError('Rendering error / Erreur de rendu.');
        }
      })
      .finally(() => {
        if (isMounted) setIsRenderingPage(false);
      });

    return () => {
      isMounted = false;
    };
  }, [file, currentPage, showError]);

  const handleFileSelected = async (files: File[]) => {
    const selected = files[0];
    setFile(selected);
    setCurrentPage(1);
    resetFeedback();

    try {
      setTotalPages(await getPdfPageCount(selected));
    } catch (err) {
      console.error(err);
      showError("Cannot open PDF / Impossible d'ouvrir ce fichier PDF.");
    }
  };

  const handleApplySignature = async () => {
    if (!file || !signatureDataUrl) return;

    setIsProcessing(true);
    resetFeedback();

    try {
      const signedBytes = await signAndDatePdf(
        file,
        currentPage,
        signatureDataUrl,
        sigPlacement,
        stampedDate ? { text: stampedDate, ...datePlacement } : undefined
      );
      downloadPdf(signedBytes, `${stripExtension(file.name)}_signe.pdf`);

      fireSuccessConfetti();
      showSuccess(t('tools.sign.success'));
    } catch (err) {
      console.error(err);
      showError("Error signing document / Erreur d'application.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToolHeader title={t('tools.sign.headerTitle')} description={t('tools.sign.headerDesc')}>
        {file && (
          <HeaderActionButton
            label={t('tools.organize.changeFile')}
            onClick={() => {
              setFile(null);
              setSignatureDataUrl(null);
            }}
          />
        )}
      </ToolHeader>

      <FeedbackAlerts successMessage={successMessage} errorMessage={errorMessage} />

      {!file ? (
        <Dropzone onFilesSelected={handleFileSelected} multiple={false} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left panel: Controls & Signature creation */}
          <div className="lg:col-span-5 space-y-5">
            <PageNavigator currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

            <SignatureCreator signatureDataUrl={signatureDataUrl} onSignatureChange={setSignatureDataUrl} />

            <DateStampOptions
              includeDate={includeDate}
              onIncludeDateChange={setIncludeDate}
              dateText={dateText}
              onDateTextChange={setDateText}
            />

            {/* Size control for signature */}
            {signatureDataUrl && (
              <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-700">{t('tools.sign.sigSize')}</span>
                <input
                  type="range"
                  min="15"
                  max="45"
                  value={sigPlacement.widthPercent}
                  onChange={(e) => resizeSignature(parseInt(e.target.value, 10))}
                  className="flex-1 accent-emerald-600"
                />
                <span className="text-xs font-mono text-slate-500 w-8">{sigPlacement.widthPercent}%</span>
              </div>
            )}

            <ProcessingButton
              onClick={handleApplySignature}
              disabled={isProcessing || !signatureDataUrl}
              isProcessing={isProcessing}
              icon={<Download className="w-5 h-5" />}
              label={t('tools.sign.btnSign')}
              processingLabel={t('tools.sign.processing')}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            />
          </div>

          <SignaturePreview
            canvasRef={previewCanvasRef}
            containerRef={previewContainerRef}
            isRendering={isRenderingPage}
            currentPage={currentPage}
            signatureDataUrl={signatureDataUrl}
            sigPlacement={sigPlacement}
            dateText={stampedDate === null ? null : dateText}
            datePlacement={datePlacement}
            draggingTarget={draggingTarget}
            onStartDrag={startDrag}
          />
        </div>
      )}
    </div>
  );
};
