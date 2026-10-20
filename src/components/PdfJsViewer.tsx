import React, { useEffect, useRef, useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  ExternalLink, 
  FileText, 
  Loader2,
  Maximize2,
  X
} from 'lucide-react';

interface PdfJsViewerProps {
  pdfUrl: string;
  title?: string;
  onClose?: () => void; // Optional callback for closing (e.g., if used in a modal)
}

// Global promise to prevent duplicate loading script elements
let globalPdfJsPromise: Promise<any> | null = null;

function loadPdfJs(): Promise<any> {
  if (globalPdfJsPromise) {
    return globalPdfJsPromise;
  }

  globalPdfJsPromise = new Promise((resolve, reject) => {
    // Check if pdfjsLib is already globally available
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }

    // Check if the script tag is already in DOM
    const existingScript = document.querySelector('script[src*="pdf.min.js"]');
    if (existingScript) {
      const handleLoad = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        if (pdfjsLib) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve(pdfjsLib);
        }
      };
      
      existingScript.addEventListener('load', handleLoad);
      existingScript.addEventListener('error', () => {
        reject(new Error('Failed to load PDF.js from existing script'));
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(pdfjsLib);
      } else {
        reject(new Error('PDF.js failed to initialize'));
      }
    };
    script.onerror = () => {
      globalPdfJsPromise = null; // Reset to allow retry on next load
      reject(new Error('Failed to load PDF.js script'));
    };
    document.body.appendChild(script);
  });

  return globalPdfJsPromise;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const parts = base64.split(';base64,');
  const base64Data = parts[1] || parts[0];
  const binaryString = window.atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function PdfJsViewer({ pdfUrl, title, onClose }: PdfJsViewerProps) {
  const [localBlobUrl, setLocalBlobUrl] = useState<string>('');
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  // Generate memory-safe blob URL for direct download or browser tabs
  useEffect(() => {
    if (!pdfUrl) return;

    if (pdfUrl.startsWith('data:application/pdf;base64,')) {
      try {
        const bytes = base64ToUint8Array(pdfUrl);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setLocalBlobUrl(url);
        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (e) {
        console.error('Error generating blob from base64:', e);
        setLocalBlobUrl(pdfUrl);
      }
    } else {
      setLocalBlobUrl(pdfUrl);
    }
  }, [pdfUrl]);

  // Load PDF Document
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError('');
    setPdfDoc(null);

    loadPdfJs()
      .then(async (pdfjsLib) => {
        if (!isMounted) return;

        try {
          let loadingTask;
          if (pdfUrl.startsWith('data:application/pdf;base64,')) {
            const bytes = base64ToUint8Array(pdfUrl);
            loadingTask = pdfjsLib.getDocument({ data: bytes });
          } else {
            loadingTask = pdfjsLib.getDocument(pdfUrl);
          }

          const doc = await loadingTask.promise;
          if (isMounted) {
            setPdfDoc(doc);
            setNumPages(doc.numPages);
            setPageNumber(1);
            setIsLoading(false);
          }
        } catch (err: any) {
          console.error('Error loading PDF document:', err);
          if (isMounted) {
            setError('Gagal memproses berkas PDF ini. Pastikan format berkas valid.');
            setIsLoading(false);
          }
        }
      })
      .catch((err) => {
        console.error('Error loading PDF.js script:', err);
        if (isMounted) {
          setError('Gagal menginisialisasi pembaca PDF. Silakan coba beberapa saat lagi.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [pdfUrl]);

  // Render Page to Canvas
  useEffect(() => {
    if (!pdfDoc) return;

    let isMounted = true;
    setIsRendering(true);

    // Cancel active rendering to prevent overlapping rendering on fast page turns
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch (e) {}
    }

    pdfDoc.getPage(pageNumber)
      .then(async (page: any) => {
        if (!isMounted) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const viewport = page.getViewport({ scale });
        const pixelRatio = window.devicePixelRatio || 1;

        // Set dimensions for Crisp High-DPI Rendering
        canvas.width = viewport.width * pixelRatio;
        canvas.height = viewport.height * pixelRatio;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;

        try {
          await task.promise;
          if (isMounted) {
            setIsRendering(false);
          }
        } catch (err: any) {
          if (err?.name === 'RenderingCancelledException' || err?.message?.includes('cancelled')) {
            return;
          }
          console.error('Render page error:', err);
          if (isMounted) {
            setIsRendering(false);
          }
        }
      })
      .catch((err: any) => {
        console.error('Get page error:', err);
        if (isMounted) {
          setIsRendering(false);
        }
      });

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {}
      }
    };
  }, [pdfDoc, pageNumber, scale]);

  const changePage = (offset: number) => {
    const newPage = pageNumber + offset;
    if (newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage);
    }
  };

  const adjustScale = (amount: number) => {
    setScale((prev) => Math.min(Math.max(prev + amount, 0.6), 2.5));
  };

  const cleanTitle = title ? title.replace(/\s+/g, '_') : 'tata_ibadah';

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 overflow-hidden relative rounded-xl">
      {/* Dynamic Header Toolbar */}
      <div className="bg-slate-950 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0 z-10">
        <div className="flex items-center space-x-2 min-w-0">
          <FileText className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-xs font-bold truncate max-w-[180px] sm:max-w-xs text-slate-200">
            {title || "Tata Ibadah"}
          </span>
        </div>

        {/* Navigation & Controls */}
        {!isLoading && !error && (
          <div className="flex items-center space-x-1 sm:space-x-3 bg-slate-900 rounded-lg p-1 border border-slate-800 shrink-0">
            {/* Page back */}
            <button
              onClick={() => changePage(-1)}
              disabled={pageNumber <= 1}
              className="p-1 sm:p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page Indicator */}
            <span className="text-[11px] font-mono font-bold text-slate-300 min-w-[65px] text-center select-none">
              Hal {pageNumber} / {numPages}
            </span>

            {/* Page forward */}
            <button
              onClick={() => changePage(1)}
              disabled={pageNumber >= numPages}
              className="p-1 sm:p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-slate-800 hidden sm:block"></div>

            {/* Zoom Out */}
            <button
              onClick={() => adjustScale(-0.2)}
              disabled={scale <= 0.6}
              className="p-1 sm:p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer hidden sm:block"
              title="Perkecil"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            {/* Zoom Percent */}
            <span className="text-[10px] font-mono text-slate-400 min-w-[35px] text-center select-none hidden sm:block">
              {Math.round(scale * 100)}%
            </span>

            {/* Zoom In */}
            <button
              onClick={() => adjustScale(0.2)}
              disabled={scale >= 2.5}
              className="p-1 sm:p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer hidden sm:block"
              title="Perbesar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Global Action items */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
          {/* Zoom Controls for Mobile (Compact layout) */}
          {!isLoading && !error && (
            <div className="flex sm:hidden items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
              <button
                onClick={() => adjustScale(-0.2)}
                disabled={scale <= 0.6}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded disabled:opacity-30"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => adjustScale(0.2)}
                disabled={scale >= 2.5}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded disabled:opacity-30"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {localBlobUrl && (
            <a
              href={localBlobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1.5 sm:px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center space-x-1 transition shadow cursor-pointer"
              title="Buka di Tab Baru"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tab Baru</span>
            </a>
          )}
          <a
            href={pdfUrl}
            download={`${cleanTitle}.pdf`}
            className="px-2 py-1.5 sm:px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center space-x-1 transition border border-slate-700 cursor-pointer"
            title="Unduh File"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Unduh</span>
          </a>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 w-full bg-slate-950 overflow-auto relative flex justify-center items-start p-4 min-h-0">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-xs font-medium font-sans">Menyiapkan halaman dokumen...</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-300">
            <FileText className="w-12 h-12 text-red-500 mb-3" />
            <h4 className="text-sm font-bold mb-2">Gagal Menampilkan Tata Ibadah</h4>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">{error}</p>
            {localBlobUrl && (
              <div className="flex gap-2">
                <a
                  href={localBlobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka di Tab Baru</span>
                </a>
                <a
                  href={pdfUrl}
                  download={`${cleanTitle}.pdf`}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Crisp HTML5 PDF Canvas element */}
        {!isLoading && !error && (
          <div className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-800 bg-white transition-all duration-200">
            {isRendering && (
              <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur text-white px-2 py-1 rounded text-[9px] font-bold flex items-center space-x-1 select-none pointer-events-none">
                <Loader2 className="w-2.5 h-2.5 animate-spin text-blue-400" />
                <span>Memuat...</span>
              </div>
            )}
            <canvas ref={canvasRef} className="block max-w-full" />
          </div>
        )}
      </div>
    </div>
  );
}
