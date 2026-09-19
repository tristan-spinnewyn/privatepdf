import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropzone } from '../ui/Dropzone';
import { getPdfPageCount, renderPageToCanvas } from '../../lib/pdf-renderer';
import { signAndDatePdf, downloadPdf } from '../../lib/pdf-service';
import { fireSuccessConfetti } from '../../lib/confetti';
import {
  PenTool,
  Upload,
  Eraser,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Move
} from 'lucide-react';

export const SignTool: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Signature creation mode: 'draw' | 'upload'
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
  const [penColor, setPenColor] = useState('#1e3a8a');
  const [penWidth, setPenWidth] = useState(3);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // Date feature
  const [includeDate, setIncludeDate] = useState(true);
  const [dateText, setDateText] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString(i18n.language.startsWith('en') ? 'en-US' : 'fr-FR');
  });

  // Update date format on language change
  useEffect(() => {
    const today = new Date();
    setDateText(today.toLocaleDateString(i18n.language.startsWith('en') ? 'en-US' : 'fr-FR'));
  }, [i18n.language]);

  // Interactive placement relative to document preview (in %)
  const [sigPlacement, setSigPlacement] = useState({
    xPercent: 60,
    yPercent: 75,
    widthPercent: 25,
    heightPercent: 10,
  });

  const [datePlacement, setDatePlacement] = useState({
    xPercent: 60,
    yPercent: 71,
  });

  // Dragging state
  const [draggingTarget, setDraggingTarget] = useState<'sig' | 'date' | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialPos, setInitialPos] = useState<{ x: number; y: number } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isRenderingPage, setIsRenderingPage] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // References
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const handleFileSelected = async (files: File[]) => {
    if (!files || files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setCurrentPage(1);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const count = await getPdfPageCount(selected);
      setTotalPages(count);
    } catch (err) {
      console.error(err);
      setErrorMessage("Cannot open PDF / Impossible d'ouvrir ce fichier PDF.");
    }
  };

  useEffect(() => {
    if (!file || !previewCanvasRef.current) return;

    let isMounted = true;
    setIsRenderingPage(true);

    renderPageToCanvas(file, currentPage, previewCanvasRef.current, 700)
      .catch((err: unknown) => {
        if (isMounted) {
          console.error(err);
          setErrorMessage('Rendering error / Erreur de rendu.');
        }
      })
      .finally(() => {
        if (isMounted) setIsRenderingPage(false);
      });

    return () => {
      isMounted = false;
    };
  }, [file, currentPage]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    lastPointRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const currentPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();

    lastPointRef.current = currentPoint;
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;

    if (signatureCanvasRef.current) {
      setSignatureDataUrl(signatureCanvasRef.current.toDataURL('image/png'));
    }
  };

  const clearDrawing = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignatureDataUrl(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setSignatureDataUrl(event.target.result);
      }
    };
    reader.readAsDataURL(uploadedFile);
  };

  const handleDragStart = (target: 'sig' | 'date', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingTarget(target);
    setDragStart({ x: e.clientX, y: e.clientY });

    if (target === 'sig') {
      setInitialPos({ x: sigPlacement.xPercent, y: sigPlacement.yPercent });
    } else {
      setInitialPos({ x: datePlacement.xPercent, y: datePlacement.yPercent });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingTarget || !dragStart || !initialPos || !previewContainerRef.current) return;

      const rect = previewContainerRef.current.getBoundingClientRect();
      const deltaXPercent = ((e.clientX - dragStart.x) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - dragStart.y) / rect.height) * 100;

      if (draggingTarget === 'sig') {
        const newX = Math.max(0, Math.min(100 - sigPlacement.widthPercent, initialPos.x + deltaXPercent));
        const newY = Math.max(0, Math.min(100 - sigPlacement.heightPercent, initialPos.y + deltaYPercent));
        setSigPlacement((prev) => ({ ...prev, xPercent: newX, yPercent: newY }));
      } else if (draggingTarget === 'date') {
        const newX = Math.max(0, Math.min(90, initialPos.x + deltaXPercent));
        const newY = Math.max(0, Math.min(95, initialPos.y + deltaYPercent));
        setDatePlacement({ xPercent: newX, yPercent: newY });
      }
    };

    const handleMouseUp = () => {
      setDraggingTarget(null);
      setDragStart(null);
      setInitialPos(null);
    };

    if (draggingTarget) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingTarget, dragStart, initialPos, sigPlacement.widthPercent, sigPlacement.heightPercent]);

  const handleApplySignature = async () => {
    if (!file) return;
    if (!signatureDataUrl) {
      setErrorMessage(t('tools.sign.drawPlaceholder'));
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const signedBytes = await signAndDatePdf(
        file,
        currentPage,
        signatureDataUrl,
        sigPlacement,
        includeDate && dateText.trim()
          ? {
              text: dateText.trim(),
              xPercent: datePlacement.xPercent,
              yPercent: datePlacement.yPercent,
            }
          : undefined
      );

      const baseName = file.name.replace(/\.[^/.]+$/, '');
      downloadPdf(signedBytes, `${baseName}_signe.pdf`);

      fireSuccessConfetti();
      setSuccessMessage(t('tools.sign.success'));
    } catch (err) {
      console.error(err);
      setErrorMessage("Error signing document / Erreur d'application.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('tools.sign.headerTitle')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {t('tools.sign.headerDesc')}
          </p>
        </div>

        {file && (
          <button
            onClick={() => {
              setFile(null);
              setSignatureDataUrl(null);
            }}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          >
            {t('tools.organize.changeFile')}
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Main Area */}
      {!file ? (
        <Dropzone
          onFilesSelected={handleFileSelected}
          multiple={false}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left panel: Controls & Signature creation */}
          <div className="lg:col-span-5 space-y-5">
            {/* Page navigation bar */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">{t('tools.sign.pageToSign')}</span>
                <span className="px-2.5 py-1 bg-slate-100 font-extrabold text-xs text-slate-800 rounded-lg">
                  {currentPage} / {totalPages}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                  title={t('tools.sign.prev')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                  title={t('tools.sign.next')}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Signature Creation Card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                  <PenTool className="w-4 h-4 text-emerald-600" />
                  <span>{t('tools.sign.signatureTitle')}</span>
                </div>

                <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs">
                  <button
                    onClick={() => setMode('draw')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      mode === 'draw' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {t('tools.sign.tabDraw')}
                  </button>
                  <button
                    onClick={() => setMode('upload')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      mode === 'upload' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {t('tools.sign.tabUpload')}
                  </button>
                </div>
              </div>

              {mode === 'draw' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {/* Colors */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400 mr-1">{t('tools.sign.color')}</span>
                      {[
                        { color: '#000000', label: 'Noir / Black' },
                        { color: '#1e3a8a', label: 'Bleu marine / Navy' },
                        { color: '#2563eb', label: 'Bleu roi / Blue' },
                      ].map((c) => (
                        <button
                          key={c.color}
                          onClick={() => setPenColor(c.color)}
                          style={{ backgroundColor: c.color }}
                          title={c.label}
                          className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                            penColor === c.color ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : 'opacity-80 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Pen thickness */}
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                      {[
                        { width: 2, label: t('tools.sign.thin') },
                        { width: 3.5, label: t('tools.sign.medium') },
                        { width: 5, label: t('tools.sign.thick') },
                      ].map((tItem) => (
                        <button
                          key={tItem.width}
                          onClick={() => setPenWidth(tItem.width)}
                          className={`px-2 py-0.5 rounded-md font-medium cursor-pointer transition-colors ${
                            penWidth === tItem.width
                              ? 'bg-white shadow-xs text-slate-900 font-bold'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {tItem.label}
                        </button>
                      ))}
                    </div>

                    {/* Clear button */}
                    <button
                      onClick={clearDrawing}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      <span>{t('tools.sign.clear')}</span>
                    </button>
                  </div>

                  {/* Canvas Pad */}
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 relative overflow-hidden touch-none">
                    <canvas
                      ref={signatureCanvasRef}
                      width={400}
                      height={180}
                      onPointerDown={startDrawing}
                      onPointerMove={draw}
                      onPointerUp={stopDrawing}
                      onPointerCancel={stopDrawing}
                      className="w-full h-40 cursor-crosshair bg-transparent"
                    />
                    {!signatureDataUrl && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs font-medium">
                        {t('tools.sign.drawPlaceholder')}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center">
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="signature-upload"
                  />
                  <label
                    htmlFor="signature-upload"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                  >
                    <Upload className="w-8 h-8 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-700">
                      {t('tools.sign.uploadPlaceholder')}
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Date options */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeDate}
                    onChange={(e) => setIncludeDate(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>{t('tools.sign.addDate')}</span>
                  </span>
                </label>
              </div>

              {includeDate && (
                <div className="pt-2">
                  <input
                    type="text"
                    value={dateText}
                    onChange={(e) => setDateText(e.target.value)}
                    placeholder="19/09/2026"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {t('tools.sign.dateHelp')}
                  </p>
                </div>
              )}
            </div>

            {/* Size control for signature */}
            {signatureDataUrl && (
              <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-700">{t('tools.sign.sigSize')}</span>
                <input
                  type="range"
                  min="15"
                  max="45"
                  value={sigPlacement.widthPercent}
                  onChange={(e) => {
                    const w = parseInt(e.target.value, 10);
                    setSigPlacement((prev) => ({
                      ...prev,
                      widthPercent: w,
                      heightPercent: Math.round(w * 0.45),
                    }));
                  }}
                  className="flex-1 accent-emerald-600"
                />
                <span className="text-xs font-mono text-slate-500 w-8">{sigPlacement.widthPercent}%</span>
              </div>
            )}

            {/* Confirm & Download button */}
            <button
              onClick={handleApplySignature}
              disabled={isProcessing || !signatureDataUrl}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t('tools.sign.processing')}</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>{t('tools.sign.btnSign')}</span>
                </>
              )}
            </button>
          </div>

          {/* Right panel: Interactive Document View with overlay */}
          <div className="lg:col-span-7 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-3 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 font-medium">
                <Move className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('tools.sign.dragHelp')}</span>
              </div>
              <span>{t('tools.organize.page')} {currentPage}</span>
            </div>

            {/* Container for PDF Canvas + Interactive Draggable Overlays */}
            <div
              ref={previewContainerRef}
              className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-100 shadow-md select-none max-w-full"
            >
              {isRenderingPage && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-30">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                </div>
              )}

              {/* PDF Document Canvas */}
              <canvas ref={previewCanvasRef} className="block max-w-full h-auto" />

              {/* Draggable Signature Overlay */}
              {signatureDataUrl && (
                <div
                  onMouseDown={(e) => handleDragStart('sig', e)}
                  style={{
                    left: `${sigPlacement.xPercent}%`,
                    top: `${sigPlacement.yPercent}%`,
                    width: `${sigPlacement.widthPercent}%`,
                    height: `${sigPlacement.heightPercent}%`,
                  }}
                  className={`absolute z-20 border-2 border-emerald-500 bg-emerald-500/10 rounded-lg cursor-grab active:cursor-grabbing flex items-center justify-center group transition-shadow ${
                    draggingTarget === 'sig' ? 'ring-4 ring-emerald-500/30 shadow-lg' : 'hover:border-emerald-600'
                  }`}
                >
                  <img
                    src={signatureDataUrl}
                    alt="Signature"
                    className="w-full h-full object-contain pointer-events-none p-1"
                  />
                  <div className="absolute -top-5 left-0 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs pointer-events-none flex items-center gap-1">
                    <PenTool className="w-2.5 h-2.5" />
                    <span>Signature</span>
                  </div>
                </div>
              )}

              {/* Draggable Date Overlay */}
              {includeDate && dateText.trim() && (
                <div
                  onMouseDown={(e) => handleDragStart('date', e)}
                  style={{
                    left: `${datePlacement.xPercent}%`,
                    top: `${datePlacement.yPercent}%`,
                  }}
                  className={`absolute z-20 px-2 py-0.5 bg-white/90 border border-emerald-400 rounded-md shadow-xs text-[11px] font-bold text-slate-800 cursor-grab active:cursor-grabbing select-none group ${
                    draggingTarget === 'date' ? 'ring-2 ring-emerald-500' : 'hover:border-emerald-600'
                  }`}
                >
                  {dateText}
                  <div className="absolute -top-4 left-0 bg-slate-700 text-white text-[8px] font-bold px-1 rounded pointer-events-none">
                    Date
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
