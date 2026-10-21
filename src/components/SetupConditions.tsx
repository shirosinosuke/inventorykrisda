import React, { useState } from 'react';
import { ConditionSetting, InventoryItem } from '../types.ts';
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Package,
  X,
  ShieldCheck,
  Check
} from 'lucide-react';

interface SetupConditionsProps {
  conditions: ConditionSetting[];
  items: InventoryItem[];
  onSaveConditions: (updated: ConditionSetting[]) => void;
  onUpdateItemConditionName: (oldName: string, newName: string) => void;
  showToast: (msg: string) => void;
}

export const SetupConditions: React.FC<SetupConditionsProps> = ({
  conditions,
  items,
  onSaveConditions,
  onUpdateItemConditionName,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCondition, setEditingCondition] = useState<ConditionSetting | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [badgeColor, setBadgeColor] = useState<ConditionSetting['badgeColor']>('emerald');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const getConditionItemCount = (condName: string) => {
    return items.filter(it => it.condition.toLowerCase() === condName.toLowerCase()).length;
  };

  const filteredConditions = conditions.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openAddModal = () => {
    setEditingCondition(null);
    setName('');
    setBadgeColor('emerald');
    setDescription('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: ConditionSetting) => {
    setEditingCondition(c);
    setName(c.name);
    setBadgeColor(c.badgeColor);
    setDescription(c.description || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMsg('Nama kondisi tidak boleh kosong.');
      return;
    }

    const isDuplicate = conditions.some(
      c => c.name.toLowerCase() === trimmed.toLowerCase() && c.id !== editingCondition?.id
    );
    if (isDuplicate) {
      setErrorMsg('Kondisi dengan nama ini sudah ada.');
      return;
    }

    if (editingCondition) {
      const oldName = editingCondition.name;
      const updatedList = conditions.map(c =>
        c.id === editingCondition.id
          ? { ...c, name: trimmed, badgeColor, description: description.trim() }
          : c
      );
      onSaveConditions(updatedList);
      if (oldName !== trimmed) {
        onUpdateItemConditionName(oldName, trimmed);
      }
      showToast(`Kondisi "${trimmed}" berhasil diperbarui.`);
    } else {
      const newCond: ConditionSetting = {
        id: `cond-${Date.now()}`,
        name: trimmed,
        badgeColor,
        description: description.trim(),
        createdAt: new Date().toISOString().split('T')[0],
      };
      onSaveConditions([...conditions, newCond]);
      showToast(`Kondisi "${trimmed}" berhasil ditambahkan.`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (c: ConditionSetting) => {
    const itemCount = getConditionItemCount(c.name);
    if (itemCount > 0) {
      const confirmForce = window.confirm(
        `Perhatian: Kondisi "${c.name}" sedang digunakan oleh ${itemCount} barang inventaris!\n\nJika dihapus, barang-barang tersebut akan dipindahkan ke kondisi "Baik".\n\nLanjutkan penghapusan?`
      );
      if (!confirmForce) return;
      onUpdateItemConditionName(c.name, 'Baik');
    } else {
      const confirmDelete = window.confirm(`Hapus kondisi "${c.name}"?`);
      if (!confirmDelete) return;
    }

    const updated = conditions.filter(item => item.id !== c.id);
    onSaveConditions(updated);
    showToast(`Kondisi "${c.name}" berhasil dihapus.`);
  };

  const COLOR_MAP: Record<ConditionSetting['badgeColor'], { label: string; badge: string; dot: string }> = {
    emerald: { label: 'Hijau (Baik)', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    amber: { label: 'Kuning (Perlu Servis)', badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    rose: { label: 'Merah (Kritis/Rusak)', badge: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
    blue: { label: 'Biru (Sedang Dikerjakan)', badge: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    purple: { label: 'Ungu (Kondisi Khusus)', badge: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
    slate: { label: 'Abu-abu (Netral/Afkir)', badge: 'bg-slate-100 text-slate-700 border-slate-300', dot: 'bg-slate-500' },
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Tag className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Setup Master Kondisi Fisik</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Atur parameter status kelayakan fisik barang untuk kontrol mutu dan pemeliharaan aset kantor.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kondisi</span>
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama kondisi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
          />
        </div>
        <div className="sm:col-span-4 flex items-center justify-start sm:justify-end gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{filteredConditions.length}</span> Status Kondisi
        </div>
      </div>

      {/* Condition Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredConditions.map((cond) => {
          const count = getConditionItemCount(cond.name);
          const colorMeta = COLOR_MAP[cond.badgeColor] || COLOR_MAP.slate;

          return (
            <div
              key={cond.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${colorMeta.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${colorMeta.dot}`} />
                    <span>{cond.name}</span>
                  </span>

                  <div className="flex items-center gap-1 text-slate-400">
                    <button
                      onClick={() => openEditModal(cond)}
                      className="p-1 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Kondisi"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cond)}
                      className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Kondisi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">
                  {cond.description || 'Tidak ada catatan tambahan untuk kondisi ini.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Barang Berstatus Ini:</span>
                <span className="inline-flex items-center gap-1 text-slate-700 font-semibold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                  <Package className="w-3 h-3 text-slate-400" />
                  <span>{count} Unit</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Condition */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                {editingCondition ? 'Edit Kondisi Fisik' : 'Tambah Kondisi Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kondisi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Misal: Dalam Perbaikan, Afkir / Musnah, Siap Pakai"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Warna Indikator Badge
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(COLOR_MAP) as ConditionSetting['badgeColor'][]).map((key) => {
                    const meta = COLOR_MAP[key];
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setBadgeColor(key)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                          badgeColor === key
                            ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${meta.dot} shrink-0`} />
                        <span className="text-xs font-medium text-slate-700 truncate">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan / Kriteria Status
                </label>
                <textarea
                  rows={3}
                  placeholder="Kriteria fisik saat barang dikategorikan pada kondisi ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  {editingCondition ? 'Simpan Perubahan' : 'Tambahkan Kondisi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
