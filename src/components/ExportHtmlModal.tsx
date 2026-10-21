import React, { useState } from 'react';
import { X, Copy, Download, Check, FileCode, ExternalLink } from 'lucide-react';
import { getStandaloneHtmlSource } from '../utils/standaloneHtml.ts';

interface ExportHtmlModalProps {
  onClose: () => void;
}

export const ExportHtmlModal: React.FC<ExportHtmlModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const htmlCode = getStandaloneHtmlSource();

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Kode 1 File HTML Utuh (Standalone)</h3>
              <p className="text-xs text-slate-300">
                Single Page Application komplit (Tailwind + JsBarcode + HTML5-QRCode + SheetJS)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 text-xs text-indigo-900 leading-relaxed flex items-start gap-2.5">
            <ExternalLink className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong>Siap dijalankan langsung di browser apa pun:</strong> File HTML ini sepenuhnya mandiri tanpa memerlukan instalasi Node.js atau server. Cukup simpan sebagai <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-300 font-mono">index.html</code> dan klik dua kali untuk membuka di Chrome, Edge, Safari, atau Firefox.
            </div>
          </div>

          <div className="relative">
            <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-[360px] border border-slate-800 leading-relaxed select-all">
              <code>{htmlCode}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <span className="text-xs text-slate-500 font-mono">Ukuran: ~{(htmlCode.length / 1024).toFixed(1)} KB (Komplit)</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              {copied ? 'Tersalin ke Clipboard!' : 'Salin Seluruh Kode'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Unduh index.html
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
