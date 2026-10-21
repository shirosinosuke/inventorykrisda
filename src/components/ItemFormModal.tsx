import React, { useState, useRef } from 'react';
import { InventoryItem, ItemCondition, CATEGORIES, CONDITIONS } from '../types.ts';
import { QRCodeView } from './QRCodeView.tsx';
import {
  X,
  Upload,
  Camera,
  Trash2,
  Save,
  QrCode,
  Layers,
  MapPin,
  Calendar,
  FileText,
  Tag,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

interface ItemFormModalProps {
  itemToEdit?: InventoryItem | null;
  nextGeneratedId: string;
  categories?: string[];
  conditions?: string[];
  onSave: (item: InventoryItem) => void;
  onClose: () => void;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  itemToEdit,
  nextGeneratedId,
  categories = CATEGORIES as unknown as string[],
  conditions = CONDITIONS as unknown as string[],
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(itemToEdit);
  const todayStr = new Date().toISOString().split('T')[0];

  const activeCategories = categories && categories.length > 0 ? categories : (CATEGORIES as unknown as string[]);
  const activeConditions = conditions && conditions.length > 0 ? conditions : (CONDITIONS as unknown as string[]);

  const [id] = useState(itemToEdit ? itemToEdit.id : nextGeneratedId);
  const [name, setName] = useState(itemToEdit ? itemToEdit.name : '');
  const [category, setCategory] = useState(itemToEdit ? itemToEdit.category : activeCategories[0]);
  const [dateRecorded, setDateRecorded] = useState(itemToEdit ? itemToEdit.dateRecorded : todayStr);
  const [location, setLocation] = useState(itemToEdit ? itemToEdit.location : '');
  const [quantity, setQuantity] = useState<number>(itemToEdit ? itemToEdit.quantity : 1);
  const [condition, setCondition] = useState<ItemCondition>(itemToEdit ? itemToEdit.condition : (activeConditions[0] || 'Baik'));
  const [description, setDescription] = useState(itemToEdit ? itemToEdit.description : '');
  const [photoUrl, setPhotoUrl] = useState<string>(itemToEdit ? itemToEdit.photoUrl : '');
  const [isCompressing, setIsCompressing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Compress image before saving to Base64 to keep localStorage light & fast
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Harap pilih file gambar (JPG, PNG, WebP).');
      return;
    }

    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setPhotoUrl(compressedDataUrl);
        }
        setIsCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Nama barang wajib diisi.');
      return;
    }
    if (!location.trim()) {
      setErrorMsg('Lokasi penyimpanan wajib diisi.');
      return;
    }
    if (quantity < 1) {
      setErrorMsg('Jumlah stok minimal 1 unit.');
      return;
    }

    const newItem: InventoryItem = {
      id,
      name: name.trim(),
      category,
      dateRecorded,
      location: location.trim(),
      quantity: Number(quantity),
      condition,
      description: description.trim(),
      photoUrl,
      createdAt: itemToEdit ? itemToEdit.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    onSave(newItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {isEditing ? 'Ubah Data Inventaris' : 'Input Barang Baru'}
              </h3>
              <p className="text-xs text-slate-300">
                Kode Otomatis: <strong className="font-mono text-indigo-300">{id}</strong>
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* QRCode & ID Live Preview */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Generated QR Code
              </span>
              <p className="font-mono text-sm font-bold text-indigo-600">{id}</p>
              <p className="text-[11px] text-slate-500">Otomatis digenerate sistem inventaris</p>
            </div>
            <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-2xs shrink-0">
              <QRCodeView value={id} size={56} margin={1} />
            </div>
          </div>

          {/* Nama Barang */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              Nama Barang <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Laptop Lenovo ThinkPad T14 / Kursi Kantor / Proyektor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 2-Columns: Kategori & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Kategori Barang <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {activeCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                Tanggal Pendataan <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dateRecorded}
                onChange={(e) => setDateRecorded(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* 2-Columns: Lokasi & Stok */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                Lokasi Penyimpanan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Gudang A, Ruang IT Lt. 2, R. Meeting"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Jumlah / Stok (Unit) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Kondisi Barang */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Kondisi Barang <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeConditions.map((cond) => {
                const isSelected = condition === cond;
                let activeColor = '';
                let icon = null;

                if (cond.toLowerCase().includes('baik')) {
                  activeColor = isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-emerald-50/60 text-emerald-800 border-emerald-200 hover:bg-emerald-100';
                  icon = <CheckCircle2 className="w-3.5 h-3.5" />;
                } else if (cond.toLowerCase().includes('ringan') || cond.toLowerCase().includes('perbaikan')) {
                  activeColor = isSelected
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-amber-50/60 text-amber-800 border-amber-200 hover:bg-amber-100';
                  icon = <AlertTriangle className="w-3.5 h-3.5" />;
                } else {
                  activeColor = isSelected
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-rose-50/60 text-rose-800 border-rose-200 hover:bg-rose-100';
                  icon = <XCircle className="w-3.5 h-3.5" />;
                }

                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setCondition(cond)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${activeColor}`}
                  >
                    {icon}
                    <span className="truncate">{cond}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload / Capture Foto */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                Foto Barang
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                (Otomatis dikompresi agar hemat memori)
              </span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {photoUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-100 h-44 flex items-center justify-center group">
                <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-white text-slate-800 rounded-lg text-xs font-medium hover:bg-slate-100 shadow transition cursor-pointer flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" /> Ganti
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="p-2 bg-rose-600 text-white rounded-lg text-xs font-medium hover:bg-rose-700 shadow transition cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-indigo-50/30 flex flex-col items-center justify-center gap-2"
              >
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-700">
                    {isCompressing ? 'Sedang memproses gambar...' : 'Klik untuk upload atau ambil foto dari kamera'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WebP max 5MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              Deskripsi & Catatan
            </label>
            <textarea
              rows={3}
              placeholder="Spesifikasi teknis, nomor seri, kelengkapan aksesoris, atau catatan kondisi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Form Action Footer */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isEditing ? 'Simpan Perubahan' : 'Simpan Barang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
