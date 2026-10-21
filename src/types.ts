export type ItemCondition = string;

export interface InventoryItem {
  id: string; // e.g. INV-202610-001
  name: string;
  category: string;
  dateRecorded: string; // YYYY-MM-DD
  location: string;
  quantity: number;
  condition: ItemCondition;
  description: string;
  photoUrl: string; // base64 or URL
  createdAt: number;
  updatedAt: number;
}

export interface CategorySetting {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
}

export interface ConditionSetting {
  id: string;
  name: string;
  badgeColor: 'emerald' | 'amber' | 'rose' | 'blue' | 'purple' | 'slate';
  description?: string;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'Admin Utama' | 'Staf Gudang' | 'Operator Lapangan' | 'Supervisor' | string;
  status: 'Aktif' | 'Nonaktif';
  phone?: string;
  createdAt: string;
}

export const DEFAULT_CATEGORIES: CategorySetting[] = [
  { id: 'cat-1', name: 'Peralatan Elektronik', description: 'Perangkat proyektor, dispenser, AC, audio', color: 'indigo', createdAt: '2026-10-01' },
  { id: 'cat-2', name: 'Komputer & IT', description: 'Laptop, PC Desktop, monitor, printer, router', color: 'blue', createdAt: '2026-10-01' },
  { id: 'cat-3', name: 'Perabot & Mebel', description: 'Meja kantor, kursi kerja, lemari arsip', color: 'amber', createdAt: '2026-10-01' },
  { id: 'cat-4', name: 'Alat Tulis Kantor (ATK)', description: 'Peralatan operasional dan perlengkapan kertas', color: 'emerald', createdAt: '2026-10-01' },
  { id: 'cat-5', name: 'Kendaraan & Operasional', description: 'Mobil dinas, sepeda motor operasional logistik', color: 'purple', createdAt: '2026-10-01' },
  { id: 'cat-6', name: 'Perkakas & Teknik', description: 'Tang, obeng, mesin bor, tangga lipat', color: 'rose', createdAt: '2026-10-01' },
  { id: 'cat-7', name: 'Perlengkapan Lainnya', description: 'Aset penunjang umum kantor lainnya', color: 'slate', createdAt: '2026-10-01' },
];

export const DEFAULT_CONDITIONS: ConditionSetting[] = [
  { id: 'cond-1', name: 'Baik', badgeColor: 'emerald', description: 'Kondisi prima, berfungsi normal 100%', createdAt: '2026-10-01' },
  { id: 'cond-2', name: 'Rusak Ringan', badgeColor: 'amber', description: 'Perlu sedikit perbaikan/pembersihan, masih dapat digunakan', createdAt: '2026-10-01' },
  { id: 'cond-3', name: 'Rusak Berat', badgeColor: 'rose', description: 'Tidak dapat digunakan, perlu servis menyeluruh atau ganti suku cadang', createdAt: '2026-10-01' },
  { id: 'cond-4', name: 'Dalam Perbaikan', badgeColor: 'blue', description: 'Sedang dikerjakan teknisi atau vendor servis', createdAt: '2026-10-01' },
  { id: 'cond-5', name: 'Hilang / Afkir', badgeColor: 'slate', description: 'Sudah tidak berada di inventaris atau dihapuskan', createdAt: '2026-10-01' },
];

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'usr-1',
    name: 'Administrator Logistik',
    email: 'admin@inventaris.id',
    password: 'admin123',
    role: 'Admin Utama',
    status: 'Aktif',
    phone: '0812-3456-7890',
    createdAt: '2026-10-01',
  },
  {
    id: 'usr-2',
    name: 'Ahmad Fauzi',
    email: 'staf@inventaris.id',
    password: 'staf123',
    role: 'Staf Gudang',
    status: 'Aktif',
    phone: '0821-9876-5432',
    createdAt: '2026-10-05',
  },
  {
    id: 'usr-3',
    name: 'Siti Rahma',
    email: 'operator@inventaris.id',
    password: 'operator123',
    role: 'Operator Lapangan',
    status: 'Aktif',
    phone: '0857-1122-3344',
    createdAt: '2026-10-10',
  },
];

export const CATEGORIES = DEFAULT_CATEGORIES.map(c => c.name);
export const CONDITIONS = DEFAULT_CONDITIONS.map(c => c.name);
