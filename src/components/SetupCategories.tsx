import React, { useState } from 'react';
import { CategorySetting, InventoryItem } from '../types.ts';
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface SetupCategoriesProps {
  categories: CategorySetting[];
  items: InventoryItem[];
  onSaveCategories: (updated: CategorySetting[]) => void;
  onUpdateItemCategoryName: (oldName: string, newName: string) => void;
  showToast: (msg: string) => void;
}

export const SetupCategories: React.FC<SetupCategoriesProps> = ({
  categories,
  items,
  onSaveCategories,
  onUpdateItemCategoryName,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategorySetting | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('indigo');
  const [errorMsg, setErrorMsg] = useState('');

  // Item counts per category
  const getCategoryItemCount = (catName: string) => {
    return items.filter(it => it.category.toLowerCase() === catName.toLowerCase()).length;
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setColor('indigo');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategorySetting) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setColor(cat.color || 'indigo');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Nama kategori tidak boleh kosong.');
      return;
    }

    // Check duplicate
    const isDuplicate = categories.some(
      c => c.name.toLowerCase() === trimmedName.toLowerCase() && c.id !== editingCategory?.id
    );
    if (isDuplicate) {
      setErrorMsg('Kategori dengan nama ini sudah ada.');
      return;
    }

    if (editingCategory) {
      // Edit
      const oldName = editingCategory.name;
      const updatedList = categories.map(c =>
        c.id === editingCategory.id
          ? { ...c, name: trimmedName, description: description.trim(), color }
          : c
      );
      onSaveCategories(updatedList);
      if (oldName !== trimmedName) {
        onUpdateItemCategoryName(oldName, trimmedName);
      }
      showToast(`Kategori "${trimmedName}" berhasil diperbarui.`);
    } else {
      // Add
      const newCat: CategorySetting = {
        id: `cat-${Date.now()}`,
        name: trimmedName,
        description: description.trim(),
        color,
        createdAt: new Date().toISOString().split('T')[0],
      };
      onSaveCategories([...categories, newCat]);
      showToast(`Kategori "${trimmedName}" berhasil ditambahkan.`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (cat: CategorySetting) => {
    const itemCount = getCategoryItemCount(cat.name);
    if (itemCount > 0) {
      const confirmForce = window.confirm(
        `Perhatian: Kategori "${cat.name}" sedang digunakan oleh ${itemCount} barang inventaris!\n\nJika dihapus, barang-barang tersebut akan dipindahkan ke kategori "Perlengkapan Lainnya".\n\nLanjutkan penghapusan?`
      );
      if (!confirmForce) return;
      onUpdateItemCategoryName(cat.name, 'Perlengkapan Lainnya');
    } else {
      const confirmDelete = window.confirm(`Hapus kategori "${cat.name}"?`);
      if (!confirmDelete) return;
    }

    const updated = categories.filter(c => c.id !== cat.id);
    onSaveCategories(updated);
    showToast(`Kategori "${cat.name}" berhasil dihapus.`);
  };

  const COLOR_OPTIONS = [
    { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { id: 'blue', label: 'Biru', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    { id: 'emerald', label: 'Hijau', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'amber', label: 'Kuning', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    { id: 'rose', label: 'Merah', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    { id: 'purple', label: 'Ungu', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
    { id: 'slate', label: 'Abu-abu', bg: 'bg-slate-100 text-slate-700 border-slate-300' },
  ];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Setup Master Kategori</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola kelompok jenis aset dan barang inventaris untuk kemudahan pengelompokan dan audit.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kategori</span>
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama kategori atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
          />
        </div>
        <div className="sm:col-span-4 flex items-center justify-start sm:justify-end gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{filteredCategories.length}</span> Kategori terdaftar
        </div>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => {
          const count = getCategoryItemCount(cat.name);
          const colorObj = COLOR_OPTIONS.find(c => c.id === cat.color) || COLOR_OPTIONS[0];

          return (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${colorObj.bg}`}>
                    <Layers className="w-3 h-3" />
                    <span>{cat.name}</span>
                  </span>

                  <div className="flex items-center gap-1 text-slate-400">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-1 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Kategori"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">
                  {cat.description || 'Tidak ada keterangan tambahan.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Penggunaan:</span>
                <span className="inline-flex items-center gap-1 text-slate-700 font-semibold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                  <Package className="w-3 h-3 text-slate-400" />
                  <span>{count} Barang</span>
                </span>
              </div>
            </div>
          );
        })}

        {filteredCategories.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada kategori yang cocok</p>
            <p className="text-xs text-slate-400 mt-0.5">Coba gunakan kata kunci pencarian lain atau tambahkan kategori baru.</p>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Category */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
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
                  Nama Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Misal: Audio Visual, Alat Medis, dsb."
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
                  Warna Label Identitas
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setColor(c.id)}
                      className={`px-2.5 py-1 text-xs rounded-lg border font-medium cursor-pointer transition-all ${
                        color === c.id
                          ? `${c.bg} ring-2 ring-indigo-500 ring-offset-1`
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Contoh Barang
                </label>
                <textarea
                  rows={3}
                  placeholder="Keterangan singkat mengenai cakupan kategori barang ini..."
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
                  {editingCategory ? 'Simpan Perubahan' : 'Tambahkan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
