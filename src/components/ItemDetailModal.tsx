import React, { useState } from 'react';
import { InventoryItem, ItemCondition } from '../types.ts';
import { QRCodeView } from './QRCodeView.tsx';
import { getItemScanUrl } from '../utils/qrUtils.ts';
import {
  X,
  Printer,
  Edit,
  MapPin,
  Calendar,
  Layers,
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Scan,
  Maximize2,
  QrCode
} from 'lucide-react';

interface ItemDetailModalProps {
  item: InventoryItem;
  onClose: () => void;
  onOpenPrintLabel: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onScanAnother?: () => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  onOpenPrintLabel,
  onEditItem,
  onScanAnother,
}) => {
  const [showPhotoZoom, setShowPhotoZoom] = useState(false);

  const getConditionBadge = (condition: ItemCondition) => {
    switch (condition) {
      case 'Baik':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Kondisi: Baik
          </span>
        );
      case 'Rusak Ringan':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Kondisi: Rusak Ringan
          </span>
        );
      case 'Rusak Berat':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Kondisi: Rusak Berat
          </span>
        );
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-indigo-400 bg-indigo-950/80 px-2.5 py-0.5 rounded border border-indigo-800 font-mono">
                {item.id}
              </span>
              <span className="text-xs text-slate-300">Hasil Pemindaian Barang</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-5 overflow-y-auto space-y-5">
            {/* Item Image with Fallback */}
            <div className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group aspect-video sm:aspect-2/1 flex items-center justify-center">
              {item.photoUrl ? (
                <>
                  <img
                    src={item.photoUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={() => setShowPhotoZoom(true)}
                    className="absolute bottom-2.5 right-2.5 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg text-xs backdrop-blur-xs transition-colors cursor-pointer flex items-center gap-1"
                    title="Perbesar Foto"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium">Perbesar</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 py-8">
                  <Package className="w-12 h-12 stroke-[1.2] mb-1" />
                  <span className="text-xs">Foto belum diunggah</span>
                </div>
              )}
            </div>

            {/* Title & Badge */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                  {item.category}
                </span>
                {getConditionBadge(item.condition)}
              </div>
              <h2 className="text-xl font-bold text-slate-900 leading-snug">
                {item.name}
              </h2>
            </div>

            {/* Key Information Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="space-y-1">
                <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Lokasi Penyimpanan
                </span>
                <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                  {item.location}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  Jumlah / Stok
                </span>
                <p className="font-bold text-indigo-600 text-xs sm:text-sm">
                  {item.quantity} <span className="font-medium text-slate-600">Unit</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Tanggal Pendataan
                </span>
                <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                  {item.dateRecorded}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                  <Package className="w-3.5 h-3.5 text-slate-500" />
                  Kode Inventaris
                </span>
                <p className="font-mono font-bold text-slate-800 text-xs sm:text-sm">
                  {item.id}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Deskripsi & Catatan Barang
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-wrap">
                {item.description || 'Tidak ada catatan deskripsi tambahan untuk barang ini.'}
              </p>
            </div>

            {/* QR Code Section */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <QrCode className="w-4 h-4 text-indigo-600" />
                <span>QR Code Viewer Langsung (Kamera HP)</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                <QRCodeView value={getItemScanUrl(item.id)} size={130} margin={1} />
              </div>
              <span className="text-xs font-mono font-bold text-slate-800">{item.id}</span>
              <p className="text-[11px] text-slate-500 text-center max-w-xs">
                Arahkan kamera HP ke QR code ini untuk langsung membuka rincian barang secara instan tanpa perlu login.
              </p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(getItemScanUrl(item.id));
                  alert(`Tautan viewer untuk "${item.name}" berhasil disalin ke clipboard!`);
                }}
                className="mt-1 inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
              >
                <span>Salin Tautan Viewer HP</span>
              </button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            {onScanAnother && (
              <button
                type="button"
                onClick={onScanAnother}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Scan className="w-3.5 h-3.5 text-slate-600" />
                Scan Lain
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => onEditItem(item)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-slate-600" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onOpenPrintLabel(item)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Label
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Zoom Modal */}
      {showPhotoZoom && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowPhotoZoom(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={item.photoUrl}
              alt={item.name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setShowPhotoZoom(false)}
              className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
