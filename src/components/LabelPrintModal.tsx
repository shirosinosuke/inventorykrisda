import React, { useRef } from 'react';
import QRCode from 'qrcode';
import { InventoryItem } from '../types.ts';
import { QRCodeView } from './QRCodeView.tsx';
import { Printer, X, Download, Tag, Calendar, MapPin, QrCode } from 'lucide-react';

interface LabelPrintModalProps {
  item: InventoryItem;
  onClose: () => void;
}

export const LabelPrintModal: React.FC<LabelPrintModalProps> = ({ item, onClose }) => {
  const labelRef = useRef<HTMLDivElement | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    // Generate high-resolution 50x30 mm label image (approx 300 DPI: 600x360 px)
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

    // Header bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(8, 8, canvas.width - 16, 42);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('INVENTARIS ASET', canvas.width / 2, 35);

    // Item Name (left aligned)
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    ctx.font = 'bold 22px sans-serif';
    const truncatedName = item.name.length > 25 ? item.name.substring(0, 23) + '...' : item.name;
    ctx.fillText(truncatedName, 24, 82);

    // Meta details (Category & Location only, NO QTY & NO CONDITION)
    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`Kategori: ${item.category}`, 24, 112);
    ctx.fillText(`Lokasi: ${item.location}`, 24, 138);
    ctx.fillText(`Tgl Pendataan: ${item.dateRecorded}`, 24, 164);

    // QR Code generation directly to canvas
    try {
      const qrDataUrl = await QRCode.toDataURL(item.id, {
        width: 170,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
      });
      const qrImg = new Image();
      qrImg.onload = () => {
        // Place QR code on the right side
        ctx.drawImage(qrImg, canvas.width - 195, 75, 170, 170);

        // Bottom Bar with Unique ID
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(10, canvas.height - 80, canvas.width - 20, 68);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, canvas.height - 80, canvas.width - 20, 68);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 26px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(item.id, canvas.width / 2, canvas.height - 36);

        // Trigger download
        const a = document.createElement('a');
        a.download = `Label-QR-${item.id}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      };
      qrImg.src = qrDataUrl;
    } catch (e) {
      console.error('Error drawing label image:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Cetak Label Thermal QRCode</h3>
              <p className="text-xs text-slate-300">Format Standar 50 x 30 mm (Tanpa Qty & Kondisi)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          <p className="text-xs text-slate-500 leading-relaxed">
            Format label thermal 50x30 mm dengan <strong>QRCode</strong>. Sesuai instruksi, informasi jumlah stok (Qty) dan status kerusakan telah dihilangkan dari label cetak.
          </p>

          {/* Thermal Label Preview Card (50x30 mm) */}
          <div className="flex justify-center bg-slate-100 p-6 rounded-xl border border-slate-200 shadow-inner">
            <div
              id="printable-label-area"
              ref={labelRef}
              className="bg-white w-[300px] h-[180px] p-2.5 border-2 border-dashed border-slate-400 rounded-md shadow-md flex flex-col justify-between text-black select-none"
              style={{
                boxSizing: 'border-box',
              }}
            >
              {/* Header inside label */}
              <div>
                <div className="flex items-center justify-between border-b border-black pb-1 mb-1">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-black">
                    INVENTARIS ASET
                  </span>
                  <span className="text-[8px] font-mono font-medium text-black">
                    {item.dateRecorded}
                  </span>
                </div>
                <div className="font-bold text-[11px] leading-tight line-clamp-1 text-black">
                  {item.name}
                </div>
              </div>

              {/* Middle Section: Meta Info & QR Code */}
              <div className="flex items-center justify-between gap-2 my-auto">
                <div className="space-y-0.5 text-[8px] text-black font-medium leading-tight">
                  <p className="truncate max-w-[170px]">
                    <span className="font-semibold">Kategori:</span> {item.category}
                  </p>
                  <p className="truncate max-w-[170px]">
                    <span className="font-semibold">Lokasi:</span> {item.location}
                  </p>
                </div>
                <div className="bg-white p-0.5 border border-black rounded shrink-0">
                  <QRCodeView value={item.id} size={62} margin={0} />
                </div>
              </div>

              {/* Footer info inside label: Code only (NO QTY, NO CONDITION) */}
              <div className="flex items-center justify-between text-[8px] text-black pt-1 border-t border-black font-mono">
                <span className="font-bold text-[9px] tracking-wider">{item.id}</span>
                <span className="text-[7px] uppercase font-semibold">SCAN FOR INFO</span>
              </div>
            </div>
          </div>

          {/* Quick Specifications */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              <span>Kode: <strong className="font-mono">{item.id}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tgl: {item.dateRecorded}</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span className="truncate">Lokasi: {item.location}</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleDownloadImage}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Unduh PNG
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Label Sekarang
          </button>
        </div>
      </div>
    </div>
  );
};
