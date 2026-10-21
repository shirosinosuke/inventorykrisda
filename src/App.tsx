import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Package,
  Plus,
  QrCode,
  Printer,
  Edit,
  Trash2,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  LayoutGrid,
  List,
  MapPin,
  Calendar,
  Layers,
  LogOut,
  Home,
  UserCheck,
  Menu,
  X,
  Settings,
  Users,
  Tag,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Camera,
  Database,
  Cloud,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

import {
  InventoryItem,
  CategorySetting,
  ConditionSetting,
  UserAccount,
  DEFAULT_CATEGORIES,
  DEFAULT_CONDITIONS,
  DEFAULT_USERS,
  ItemCondition
} from './types.ts';
import { INITIAL_ITEMS } from './mockData.ts';
import { QRCodeView } from './components/QRCodeView.tsx';
import { ItemFormModal } from './components/ItemFormModal.tsx';
import { ItemDetailModal } from './components/ItemDetailModal.tsx';
import { LabelPrintModal } from './components/LabelPrintModal.tsx';
import { ScannerModal } from './components/ScannerModal.tsx';
import { ExportHtmlModal } from './components/ExportHtmlModal.tsx';
import { FrontPage } from './components/FrontPage.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { SetupCategories } from './components/SetupCategories.tsx';
import { SetupConditions } from './components/SetupConditions.tsx';
import { SetupUsers } from './components/SetupUsers.tsx';

// Firestore service
import {
  initializeFirestoreDatabase,
  subscribeToItems,
  subscribeToCategories,
  subscribeToConditions,
  subscribeToUsers,
  saveItemToFirestore,
  deleteItemFromFirestore,
  saveCategoryToFirestore,
  deleteCategoryFromFirestore,
  saveConditionToFirestore,
  deleteConditionFromFirestore,
  saveUserToFirestore,
  deleteUserFromFirestore,
  FIRESTORE_RULES_SNIPPET,
  FIREBASE_CONSOLE_RULES_URL,
} from './firebase.ts';

const AUTH_KEY = 'sistem_inventaris_auth_user';

interface AuthUser {
  name: string;
  email: string;
  role: string;
}

type DashboardTab = 'inventory' | 'setup-kategori' | 'setup-kondisi' | 'setup-user';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const savedUser = localStorage.getItem(AUTH_KEY);
      if (savedUser) return JSON.parse(savedUser);
    } catch {
      // ignore
    }
    return null;
  });

  // Current page view: 'landing' | 'login' | 'dashboard'
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'dashboard'>(() => {
    try {
      const savedUser = localStorage.getItem(AUTH_KEY);
      if (savedUser) return 'dashboard';
    } catch {
      // ignore
    }
    return 'landing';
  });

  // Active dashboard tab (Left sidebar navigation)
  const [activeTab, setActiveTab] = useState<DashboardTab>('inventory');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Firestore connection & permission states
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(false);
  const [isFirestoreLoading, setIsFirestoreLoading] = useState<boolean>(true);
  const [isFirestorePermissionDenied, setIsFirestorePermissionDenied] = useState<boolean>(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [hasCopiedRules, setHasCopiedRules] = useState<boolean>(false);

  // Master Data & Items (in-memory + synced to Firestore)
  const [categories, setCategories] = useState<CategorySetting[]>(DEFAULT_CATEGORIES);
  const [conditions, setConditions] = useState<ConditionSetting[]>(DEFAULT_CONDITIONS);
  const [users, setUsers] = useState<UserAccount[]>(DEFAULT_USERS);
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_ITEMS);

  // Search & filter in dashboard
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCondition, setSelectedCondition] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'quantity'>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [printingItem, setPrintingItem] = useState<InventoryItem | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isExportHtmlOpen, setIsExportHtmlOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  const copyRulesToClipboard = () => {
    navigator.clipboard.writeText(FIRESTORE_RULES_SNIPPET);
    setHasCopiedRules(true);
    showToast('Aturan Security Rules berhasil disalin ke clipboard!');
    setTimeout(() => setHasCopiedRules(false), 3000);
  };

  const setupFirebaseRef = useRef<() => Promise<any>>(() => Promise.resolve());

  // Connect to Firestore & bind real-time listeners
  const setupFirebase = useCallback(async () => {
    setIsFirestoreLoading(true);
    const initResult = await initializeFirestoreDatabase();

    if (initResult.permissionDenied) {
      setIsFirestorePermissionDenied(true);
      setIsFirestoreConnected(false);
      setIsFirestoreLoading(false);
      setFirestoreError('Missing or insufficient permissions');
    } else if (initResult.connected) {
      setIsFirestoreConnected(true);
      setIsFirestorePermissionDenied(false);
      setIsFirestoreLoading(false);
      setFirestoreError(null);
    } else {
      setIsFirestoreLoading(false);
      if (initResult.error) setFirestoreError(initResult.error);
    }

    // 1. Subscribe to Items
    const unsubItems = subscribeToItems(
      (liveItems) => {
        if (liveItems && liveItems.length > 0) {
          setItems(liveItems);
        }
        setIsFirestoreConnected(true);
        setIsFirestorePermissionDenied(false);
        setIsFirestoreLoading(false);
      },
      (errInfo) => {
        if (errInfo.isPermissionDenied) {
          setIsFirestorePermissionDenied(true);
          setIsFirestoreConnected(false);
        }
        setIsFirestoreLoading(false);
      }
    );

    // 2. Subscribe to Categories
    const unsubCats = subscribeToCategories(
      (liveCats) => {
        if (liveCats && liveCats.length > 0) {
          setCategories(liveCats);
        }
      },
      (errInfo) => {
        if (errInfo.isPermissionDenied) setIsFirestorePermissionDenied(true);
      }
    );

    // 3. Subscribe to Conditions
    const unsubConds = subscribeToConditions(
      (liveConds) => {
        if (liveConds && liveConds.length > 0) {
          setConditions(liveConds);
        }
      },
      (errInfo) => {
        if (errInfo.isPermissionDenied) setIsFirestorePermissionDenied(true);
      }
    );

    // 4. Subscribe to Users
    const unsubUsers = subscribeToUsers(
      (liveUsers) => {
        if (liveUsers && liveUsers.length > 0) {
          setUsers(liveUsers);
        }
      },
      (errInfo) => {
        if (errInfo.isPermissionDenied) setIsFirestorePermissionDenied(true);
      }
    );

    return () => {
      unsubItems();
      unsubCats();
      unsubConds();
      unsubUsers();
    };
  }, []);

  useEffect(() => {
    setupFirebaseRef.current = setupFirebase;
  }, [setupFirebase]);

  useEffect(() => {
    let cleanupFn: (() => void) | undefined;
    setupFirebase().then((cleanup) => {
      cleanupFn = cleanup;
    });

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [setupFirebase]);

  // Firestore: Sync Categories
  const handleSaveCategories = async (updated: CategorySetting[]) => {
    const previous = [...categories];
    setCategories(updated);
    try {
      const currentIds = new Set(updated.map((c) => c.id));
      for (const oldCat of previous) {
        if (!currentIds.has(oldCat.id)) {
          await deleteCategoryFromFirestore(oldCat.id);
        }
      }
      for (const cat of updated) {
        await saveCategoryToFirestore(cat);
      }
    } catch {
      // Handled in service
    }
  };

  // Firestore: Sync Conditions
  const handleSaveConditions = async (updated: ConditionSetting[]) => {
    const previous = [...conditions];
    setConditions(updated);
    try {
      const currentIds = new Set(updated.map((c) => c.id));
      for (const oldCond of previous) {
        if (!currentIds.has(oldCond.id)) {
          await deleteConditionFromFirestore(oldCond.id);
        }
      }
      for (const cond of updated) {
        await saveConditionToFirestore(cond);
      }
    } catch {
      // Handled in service
    }
  };

  // Firestore: Sync Users
  const handleSaveUsers = async (updated: UserAccount[]) => {
    const previous = [...users];
    setUsers(updated);
    try {
      const currentIds = new Set(updated.map((u) => u.id));
      for (const oldUser of previous) {
        if (!currentIds.has(oldUser.id)) {
          await deleteUserFromFirestore(oldUser.id);
        }
      }
      for (const usr of updated) {
        await saveUserToFirestore(usr);
      }
    } catch {
      // Handled in service
    }
  };

  // Cascade category rename on existing items
  const handleUpdateItemCategoryName = async (oldName: string, newName: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.category.toLowerCase() === oldName.toLowerCase()
          ? { ...it, category: newName }
          : it
      )
    );

    const itemsToUpdate = items.filter(
      (it) => it.category.toLowerCase() === oldName.toLowerCase()
    );
    for (const item of itemsToUpdate) {
      const updated = { ...item, category: newName, updatedAt: Date.now() };
      await saveItemToFirestore(updated);
    }
  };

  // Cascade condition rename on existing items
  const handleUpdateItemConditionName = async (oldName: string, newName: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.condition.toLowerCase() === oldName.toLowerCase()
          ? { ...it, condition: newName as ItemCondition }
          : it
      )
    );

    const itemsToUpdate = items.filter(
      (it) => it.condition.toLowerCase() === oldName.toLowerCase()
    );
    for (const item of itemsToUpdate) {
      const updated = { ...item, condition: newName as ItemCondition, updatedAt: Date.now() };
      await saveItemToFirestore(updated);
    }
  };

  // Login handler
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
    setCurrentView('dashboard');
    setActiveTab('inventory');
    showToast(`Selamat datang, ${user.name}!`);
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {
      // ignore
    }
    setIsMobileSidebarOpen(false);
    setCurrentView('landing');
    showToast('Sesi telah diakhiri.');
  };

  // Auto-generate ID (INV-YYYYMM-XXX)
  const nextGeneratedId = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `INV-${year}${month}-`;

    let maxNum = 0;
    items.forEach((it) => {
      if (it.id && it.id.startsWith(prefix)) {
        const numPart = parseInt(it.id.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });
    return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
  }, [items]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
    const baik = items.filter((it) => it.condition.toLowerCase().includes('baik')).length;
    const rusakRingan = items.filter((it) =>
      it.condition.toLowerCase().includes('ringan') || it.condition.toLowerCase().includes('perbaikan')
    ).length;
    const rusakBerat = items.filter((it) =>
      it.condition.toLowerCase().includes('berat') || it.condition.toLowerCase().includes('rusak') || it.condition.toLowerCase().includes('afkir')
    ).length;
    return { totalItems, totalQuantity, baik, rusakRingan, rusakBerat };
  }, [items]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter((it) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          it.name.toLowerCase().includes(q) ||
          it.id.toLowerCase().includes(q) ||
          it.location.toLowerCase().includes(q) ||
          it.category.toLowerCase().includes(q);

        const matchesCategory = selectedCategory === 'ALL' || it.category === selectedCategory;
        const matchesCondition = selectedCondition === 'ALL' || it.condition === selectedCondition;

        return matchesQuery && matchesCategory && matchesCondition;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return (b.createdAt || 0) - (a.createdAt || 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'quantity') return b.quantity - a.quantity;
        return 0;
      });
  }, [items, searchQuery, selectedCategory, selectedCondition, sortBy]);

  // Optimistic CRUD Handlers with background Firestore sync
  const handleSaveItem = async (itemToSave: InventoryItem) => {
    const exists = items.some((it) => it.id === itemToSave.id);

    // Optimistic UI update so users never see failed actions
    if (exists) {
      setItems((prev) => prev.map((it) => (it.id === itemToSave.id ? itemToSave : it)));
    } else {
      setItems((prev) => [itemToSave, ...prev]);
    }

    // Background Firestore write
    const res = await saveItemToFirestore(itemToSave);
    if (res.isCloud) {
      showToast(`Barang ${itemToSave.id} tersimpan ke Cloud Firestore!`);
      setIsFirestoreConnected(true);
      setIsFirestorePermissionDenied(false);
    } else {
      showToast(`Barang ${itemToSave.id} disimpan (Perlu update Rules di Firebase Console).`);
      setIsFirestorePermissionDenied(true);
    }

    setIsFormOpen(false);
    setEditingItem(null);
    setDetailItem(itemToSave);
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (window.confirm(`Hapus barang "${name}" (${id})?`)) {
      setItems((prev) => prev.filter((it) => it.id !== id));
      if (detailItem?.id === id) setDetailItem(null);
      const res = await deleteItemFromFirestore(id);
      if (!res.isCloud) {
        setIsFirestorePermissionDenied(true);
      }
      showToast(`Barang ${id} berhasil dihapus.`);
    }
  };

  const handleScanSuccess = (scannedCode: string) => {
    setIsScannerOpen(false);
    const found = items.find((it) => it.id.toLowerCase() === scannedCode.toLowerCase());
    if (found) {
      setDetailItem(found);
      showToast(`Barang ${found.id} berhasil ditemukan!`);
    } else {
      showToast(`Kode "${scannedCode}" tidak terdaftar di inventaris.`);
      alert(`Kode QR "${scannedCode}" tidak ditemukan dalam sistem inventaris.`);
    }
  };

  // Export to Excel (.xlsx) using SheetJS
  const handleExportExcel = () => {
    if (items.length === 0) {
      alert('Tidak ada data inventaris untuk diekspor.');
      return;
    }

    const dataToExport = filteredItems.map((it, idx) => ({
      No: idx + 1,
      'Kode Inventaris': it.id,
      'Nama Barang': it.name,
      Kategori: it.category,
      'Tanggal Pendataan': it.dateRecorded,
      'Lokasi Penyimpanan': it.location,
      'Jumlah Stok': it.quantity,
      'Kondisi Fisik': it.condition,
      'Deskripsi / Catatan': it.description || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 32 },
      { wch: 22 },
      { wch: 16 },
      { wch: 24 },
      { wch: 12 },
      { wch: 15 },
      { wch: 40 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventaris Barang');

    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Rekap_Inventaris_${today}.xlsx`);
    showToast('File Excel berhasil diunduh!');
  };

  // 1. RENDER FRONT PAGE
  if (currentView === 'landing') {
    return (
      <>
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-60 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-medium flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
        <FrontPage
          items={items}
          isLoggedIn={Boolean(currentUser)}
          currentUser={currentUser}
          onNavigateToLogin={() => setCurrentView('login')}
          onNavigateToDashboard={() => {
            setCurrentView('dashboard');
            setActiveTab('inventory');
          }}
          onOpenScanner={() => setIsScannerOpen(true)}
          onSelectDemoItem={(item) => setDetailItem(item)}
        />
        {/* Scanner & Viewer Modals */}
        {isScannerOpen && (
          <ScannerModal
            items={items}
            onScanSuccess={handleScanSuccess}
            onClose={() => setIsScannerOpen(false)}
          />
        )}
        {detailItem && (
          <ItemDetailModal
            item={detailItem}
            onClose={() => setDetailItem(null)}
            onOpenPrintLabel={(item) => {
              setDetailItem(null);
              setPrintingItem(item);
            }}
            onEditItem={(item) => {
              if (!currentUser) {
                alert('Silakan login terlebih dahulu untuk mengedit data inventaris.');
                setCurrentView('login');
                return;
              }
              setDetailItem(null);
              setEditingItem(item);
              setIsFormOpen(true);
            }}
            onScanAnother={() => {
              setDetailItem(null);
              setIsScannerOpen(true);
            }}
          />
        )}
        {printingItem && (
          <LabelPrintModal
            item={printingItem}
            onClose={() => setPrintingItem(null)}
          />
        )}
      </>
    );
  }

  // 2. RENDER LOGIN PAGE
  if (currentView === 'login') {
    return (
      <>
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-60 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-medium flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
        <LoginPage
          users={users}
          onLoginSuccess={handleLoginSuccess}
          onBackToHome={() => setCurrentView('landing')}
        />
      </>
    );
  }

  // Helper for rendering left sidebar navigation content
  const renderSidebarContent = (isMobile = false) => {
    return (
      <div className="flex flex-col h-full justify-between">
        <div className="space-y-4">
          {/* Brand Mark & Close button on mobile */}
          <div className="flex items-center justify-between px-4 pt-5 pb-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white font-black shrink-0">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold tracking-tight text-white leading-tight truncate">
                  Sistem Inventaris
                </h2>
                <span className="text-[10px] font-semibold text-indigo-400 tracking-wide uppercase">
                  Admin Portal &bull; QR
                </span>
              </div>
            </div>

            {isMobile && (
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                title="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Firestore Connection Badge */}
          <div className="mx-4 p-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isFirestoreConnected
                      ? 'bg-emerald-400'
                      : isFirestorePermissionDenied
                      ? 'bg-amber-400'
                      : 'bg-blue-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isFirestoreConnected
                      ? 'bg-emerald-500'
                      : isFirestorePermissionDenied
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                />
              </span>
              <div className="truncate">
                <span className="text-[11px] font-semibold text-slate-200 block leading-tight">Firestore Cloud</span>
                <span className="text-[10px] font-mono text-slate-400 block truncate">inventorykrisda</span>
              </div>
            </div>
            <button
              onClick={() => {
                if (isFirestorePermissionDenied) setActiveTab('inventory');
              }}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 transition-colors cursor-pointer ${
                isFirestoreConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : isFirestorePermissionDenied
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
              }`}
              title={isFirestorePermissionDenied ? 'Klik untuk melihat panduan buka rules' : 'Status koneksi cloud'}
            >
              {isFirestoreLoading
                ? 'Sync...'
                : isFirestoreConnected
                ? 'Online'
                : isFirestorePermissionDenied
                ? 'Perlu Rules'
                : 'Connecting'}
            </button>
          </div>

          {/* User Profile Card */}
          <div className="mx-4 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate leading-snug">
                  {currentUser?.name || 'Administrator'}
                </p>
                <p className="text-[10px] text-slate-400 truncate font-mono">
                  {currentUser?.email || 'admin@inventaris.id'}
                </p>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px]">
              <span className="inline-flex items-center gap-1 text-indigo-300 font-semibold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">
                <ShieldCheck className="w-3 h-3 text-indigo-400" />
                <span>{currentUser?.role || 'Admin Utama'}</span>
              </span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Aktif
              </span>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="px-3 space-y-4">
            {/* Group 1: Menu Utama */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Menu Utama
              </span>

              <button
                onClick={() => {
                  setActiveTab('inventory');
                  if (isMobile) setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'inventory'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Package className="w-4 h-4 shrink-0" />
                  <span className="truncate">Daftar Inventaris</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    activeTab === 'inventory'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {items.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setIsScannerOpen(true);
                  if (isMobile) setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">Pindai QR Kamera</span>
              </button>

              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsFormOpen(true);
                  if (isMobile) setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="truncate">Tambah Barang Baru</span>
              </button>
            </div>

            {/* Group 2: Setup & Master Data */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Setup Master Firestore
              </span>

              {/* Setup Kategori */}
              <button
                onClick={() => {
                  setActiveTab('setup-kategori');
                  if (isMobile) setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'setup-kategori'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Layers className="w-4 h-4 shrink-0" />
                  <span className="truncate">Setup Kategori</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    activeTab === 'setup-kategori'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {categories.length}
                </span>
              </button>

              {/* Setup Kondisi */}
              <button
                onClick={() => {
                  setActiveTab('setup-kondisi');
                  if (isMobile) setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'setup-kondisi'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Tag className="w-4 h-4 shrink-0" />
                  <span className="truncate">Setup Kondisi</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    activeTab === 'setup-kondisi'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {conditions.length}
                </span>
              </button>

              {/* Setup User */}
              <button
                onClick={() => {
                  setActiveTab('setup-user');
                  if (isMobile) setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'setup-user'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Users className="w-4 h-4 shrink-0" />
                  <span className="truncate">Setup Pengguna (User)</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    activeTab === 'setup-user'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {users.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Bottom Actions */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          <button
            onClick={() => {
              setCurrentView('landing');
              if (isMobile) setIsMobileSidebarOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Halaman Depan</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar / Logout</span>
          </button>
        </div>
      </div>
    );
  };

  // 3. RENDER DASHBOARD (WITH LEFT SIDEBAR & MOBILE FRIENDLY LAYOUT)
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-60 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-medium flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* DESKTOP FIXED LEFT SIDEBAR */}
      <aside className="hidden lg:flex lg:w-64 xl:w-72 flex-col fixed inset-y-0 left-0 bg-slate-900 border-r border-slate-800 text-slate-300 z-40">
        {renderSidebarContent(false)}
      </aside>

      {/* MOBILE SLIDE-OVER DRAWER */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop overlay */}
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer content */}
          <div className="relative w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-left duration-200">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}

      {/* MAIN CONTENT WRAPPER */}
      <div className="lg:pl-64 xl:pl-72 flex-1 flex flex-col min-h-screen w-full">
        {/* TOP BAR (MOBILE & DESKTOP SUB-HEADER) */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Hamburger button for mobile */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer"
              title="Buka Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-none">
                  {activeTab === 'inventory' && 'Dashboard Inventaris Barang'}
                  {activeTab === 'setup-kategori' && 'Setup Master Kategori'}
                  {activeTab === 'setup-kondisi' && 'Setup Master Kondisi'}
                  {activeTab === 'setup-user' && 'Setup Master Pengguna'}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                  <Database className="w-3 h-3 text-indigo-500" />
                  <span>{isFirestoreConnected ? 'Firestore Cloud Online' : 'Penyimpanan Aktif'}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                Sistem Manajemen Inventaris &bull; Terhubung ke QR Code & Label Thermal 50x30 mm
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Scan QR */}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
              title="Pindai QR dengan Kamera"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>

            {/* Tambah Barang */}
            <button
              onClick={() => {
                setEditingItem(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
              title="Tambah Barang Baru"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Barang</span>
              <span className="sm:hidden">Tambah</span>
            </button>
          </div>
        </header>

        {/* MAIN BODY AREA BASED ON ACTIVETAB */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* FIRESTORE RULES GUIDE CARD WHEN PERMISSION DENIED */}
          {isFirestorePermissionDenied && (
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-6 shadow-xl text-slate-100 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 flex-wrap">
                      <span>Buka Izin Akses Firestore di Firebase Console</span>
                      <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                        Missing or insufficient permissions
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Proyek Firebase Anda (<strong className="text-amber-300 font-mono">inventorykrisda</strong>) saat ini menolak akses baca & tulis karena Security Rules default masih terkunci. Aplikasi saat ini tetap berjalan lancar di memori. Untuk mengaktifkan sinkronisasi Cloud Firestore, ikuti 3 langkah praktis ini:
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                {/* Step 1 */}
                <div className="bg-slate-800/90 border border-slate-700/80 p-3.5 rounded-xl space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-amber-400">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">1</span>
                      <span>Buka Firebase Console</span>
                    </div>
                    <p className="text-slate-300 text-[11px] mt-1.5 leading-relaxed">
                      Buka tab <strong>Rules</strong> pada Cloud Firestore di konsol Firebase proyek Anda.
                    </p>
                  </div>
                  <a
                    href={FIREBASE_CONSOLE_RULES_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer w-full"
                  >
                    <span>Buka Console Rules</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-800/90 border border-slate-700/80 p-3.5 rounded-xl space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-amber-400">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">2</span>
                      <span>Salin & Publish Rules</span>
                    </div>
                    <p className="text-slate-300 text-[11px] mt-1.5 leading-relaxed">
                      Tempelkan (*paste*) aturan di bawah lalu tekan tombol <strong>Publish</strong>.
                    </p>
                  </div>
                  <button
                    onClick={copyRulesToClipboard}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer w-full"
                  >
                    {hasCopiedRules ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{hasCopiedRules ? 'Aturan Disalin!' : 'Salin Rules (1-Klik)'}</span>
                  </button>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-800/90 border border-slate-700/80 p-3.5 rounded-xl space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-amber-400">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">3</span>
                      <span>Sambungkan Ulang</span>
                    </div>
                    <p className="text-slate-300 text-[11px] mt-1.5 leading-relaxed">
                      Setelah Publish berhasil, klik tombol ini untuk memverifikasi koneksi cloud secara langsung.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      showToast('Menghubungkan ulang ke Firestore...');
                      setupFirebaseRef.current();
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer w-full"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Coba Sambungkan Ulang</span>
                  </button>
                </div>
              </div>

              {/* Code Box */}
              <div className="relative bg-slate-950 rounded-xl p-3 border border-slate-800 text-[11px] font-mono text-emerald-300">
                <pre className="overflow-x-auto leading-relaxed">{FIRESTORE_RULES_SNIPPET}</pre>
                <button
                  onClick={copyRulesToClipboard}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[10px] font-semibold flex items-center gap-1 border border-slate-700 cursor-pointer"
                >
                  {hasCopiedRules ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{hasCopiedRules ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: INVENTORY DASHBOARD */}
          {activeTab === 'inventory' && (
            <>
              {/* KPI Stats Cards */}
              <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Total Jenis Item</span>
                    <p className="text-xl font-bold text-slate-900 leading-none mt-1">{stats.totalItems}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Total Stok Unit</span>
                    <p className="text-xl font-bold text-slate-900 leading-none mt-1">{stats.totalQuantity}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Kondisi Baik</span>
                    <p className="text-xl font-bold text-emerald-600 leading-none mt-1">{stats.baik}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Rusak Ringan</span>
                    <p className="text-xl font-bold text-amber-600 leading-none mt-1">{stats.rusakRingan}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3 col-span-2 lg:col-span-1">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Rusak Berat</span>
                    <p className="text-xl font-bold text-rose-600 leading-none mt-1">{stats.rusakBerat}</p>
                  </div>
                </div>
              </section>

              {/* Toolbar: Search, Filters, View Modes, & Excel Export */}
              <section className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                  {/* Search Bar */}
                  <div className="flex-1 w-full md:max-w-md relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Cari nama barang, kode QR (INV-...), atau lokasi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder-slate-400 transition-colors"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filters & Actions */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                    {/* Category Filter */}
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="ALL">Semua Kategori</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    {/* Condition Filter */}
                    <select
                      value={selectedCondition}
                      onChange={(e) => setSelectedCondition(e.target.value)}
                      className="px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="ALL">Semua Kondisi</option>
                      {conditions.map((cond) => (
                        <option key={cond.id} value={cond.name}>
                          {cond.name}
                        </option>
                      ))}
                    </select>

                    {/* Sort */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="newest">Terbaru Ditambahkan</option>
                      <option value="name">Nama (A-Z)</option>
                      <option value="quantity">Stok Terbanyak</option>
                    </select>

                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                      <button
                        onClick={() => setViewMode('table')}
                        className={`p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          viewMode === 'table' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Tampilan Tabel"
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('cards')}
                        className={`p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          viewMode === 'cards' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Tampilan Kartu"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Export Excel Button */}
                    <button
                      onClick={handleExportExcel}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
                      title="Ekspor Seluruh Rekap Data ke Format File Excel (.xlsx)"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span className="hidden sm:inline">Ekspor Excel</span>
                    </button>
                  </div>
                </div>

                {/* Filter info indicator */}
                {(searchQuery || selectedCategory !== 'ALL' || selectedCondition !== 'ALL') && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div>
                      Menampilkan <span className="font-bold text-slate-800">{filteredItems.length}</span> dari{' '}
                      <span className="font-bold text-slate-800">{items.length}</span> total barang inventaris.
                    </div>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('ALL');
                        setSelectedCondition('ALL');
                      }}
                      className="text-indigo-600 hover:underline cursor-pointer font-medium"
                    >
                      Reset Filter
                    </button>
                  </div>
                )}
              </section>

              {/* TABLE VIEW */}
              {viewMode === 'table' ? (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-200">
                      <thead className="bg-slate-50/80 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-4 w-12 text-center">Foto</th>
                          <th className="py-3 px-4">Barang & QR</th>
                          <th className="py-3 px-4">Kategori</th>
                          <th className="py-3 px-4">Lokasi & Tgl</th>
                          <th className="py-3 px-4 text-center">Stok</th>
                          <th className="py-3 px-4">Kondisi</th>
                          <th className="py-3 px-4 text-center w-32">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredItems.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Photo thumbnail */}
                            <td className="py-3 px-4 text-center">
                              {item.photoUrl ? (
                                <img
                                  src={item.photoUrl}
                                  alt={item.name}
                                  className="w-10 h-10 object-cover rounded-xl border border-slate-200 shadow-2xs mx-auto"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
                                  <Package className="w-4 h-4" />
                                </div>
                              )}
                            </td>

                            {/* Item name & QR code */}
                            <td className="py-3 px-4">
                              <div
                                className="font-bold text-slate-900 text-xs hover:text-indigo-600 cursor-pointer"
                                onClick={() => setDetailItem(item)}
                              >
                                {item.name}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                                  {item.id}
                                </span>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-3 px-4">
                              <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                                {item.category}
                              </span>
                            </td>

                            {/* Location & Date */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1 text-slate-700 font-medium">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span>{item.location}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {item.dateRecorded}
                              </div>
                            </td>

                            {/* Quantity */}
                            <td className="py-3 px-4 text-center font-bold text-slate-900 text-sm">
                              {item.quantity}
                            </td>

                            {/* Condition Badge */}
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                  item.condition.toLowerCase().includes('baik')
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : item.condition.toLowerCase().includes('ringan') || item.condition.toLowerCase().includes('perbaikan')
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {item.condition.toLowerCase().includes('baik') ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                ) : item.condition.toLowerCase().includes('ringan') ? (
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                )}
                                <span>{item.condition}</span>
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => setPrintingItem(item)}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                  title="Cetak Label Thermal 50x30 mm (Bebas Qty & Kondisi)"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDetailItem(item)}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                  title="Lihat Detail & QR Code"
                                >
                                  <QrCode className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingItem(item);
                                    setIsFormOpen(true);
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Data Barang"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id, item.name)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Data Barang"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {filteredItems.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400">
                              <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                              <p className="text-sm font-semibold text-slate-600">Tidak ada data inventaris yang cocok</p>
                              <p className="text-xs text-slate-400 mt-1">
                                Coba ubah kata kunci pencarian atau bersihkan filter di atas.
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* CARD VIEW (MOBILE & DESKTOP GRID) */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
                    >
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            {item.photoUrl ? (
                              <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-mono text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                              {item.id}
                            </span>
                            <h3
                              onClick={() => setDetailItem(item)}
                              className="text-xs font-bold text-slate-900 mt-1 truncate hover:text-indigo-600 cursor-pointer"
                            >
                              {item.name}
                            </h3>
                            <p className="text-[11px] text-slate-500">{item.category}</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Lokasi:</span>
                            <span className="font-medium text-slate-700 truncate block">{item.location}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Stok:</span>
                            <span className="font-bold text-slate-900 block">{item.quantity} Unit</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              item.condition.toLowerCase().includes('baik')
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.condition.toLowerCase().includes('ringan') || item.condition.toLowerCase().includes('perbaikan')
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            <span>{item.condition}</span>
                          </span>

                          <span className="text-[11px] text-slate-400">{item.dateRecorded}</span>
                        </div>
                      </div>

                      {/* Card Action footer */}
                      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                        <button
                          onClick={() => setPrintingItem(item)}
                          className="inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600 font-medium cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak Label</span>
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setDetailItem(item)}
                            className="p-1 hover:text-indigo-600 rounded cursor-pointer"
                            title="Detail"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setIsFormOpen(true);
                            }}
                            className="p-1 hover:text-blue-600 rounded cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            className="p-1 hover:text-rose-600 rounded cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB 2: SETUP KATEGORI */}
          {activeTab === 'setup-kategori' && (
            <SetupCategories
              categories={categories}
              items={items}
              onSaveCategories={handleSaveCategories}
              onUpdateItemCategoryName={handleUpdateItemCategoryName}
              showToast={showToast}
            />
          )}

          {/* TAB 3: SETUP KONDISI */}
          {activeTab === 'setup-kondisi' && (
            <SetupConditions
              conditions={conditions}
              items={items}
              onSaveConditions={handleSaveConditions}
              onUpdateItemConditionName={handleUpdateItemConditionName}
              showToast={showToast}
            />
          )}

          {/* TAB 4: SETUP USER */}
          {activeTab === 'setup-user' && (
            <SetupUsers
              users={users}
              currentLoggedInEmail={currentUser?.email}
              onSaveUsers={handleSaveUsers}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-3 py-2 z-30 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-semibold cursor-pointer ${
            activeTab === 'inventory' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Inventaris</span>
        </button>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-semibold text-emerald-400 cursor-pointer"
        >
          <QrCode className="w-4 h-4" />
          <span>Scan QR</span>
        </button>

        <button
          onClick={() => {
            setEditingItem(null);
            setIsFormOpen(true);
          }}
          className="flex flex-col items-center gap-1 py-1 px-3 bg-indigo-600 rounded-xl text-[10px] font-bold text-white shadow-md shadow-indigo-600/30 -mt-3 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah</span>
        </button>

        <button
          onClick={() => setActiveTab('setup-kategori')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-semibold cursor-pointer ${
            activeTab.startsWith('setup') ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Setup</span>
        </button>

        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          <Menu className="w-4 h-4" />
          <span>Menu</span>
        </button>
      </nav>

      {/* MODAL 1: Form Input / Edit Item */}
      {isFormOpen && (
        <ItemFormModal
          itemToEdit={editingItem}
          nextGeneratedId={nextGeneratedId}
          categories={categories.map((c) => c.name)}
          conditions={conditions.map((c) => c.name)}
          onSave={handleSaveItem}
          onClose={() => {
            setIsFormOpen(false);
            setEditingItem(null);
          }}
        />
      )}

      {/* MODAL 2: Public Viewer / Item Details */}
      {detailItem && (
        <ItemDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onOpenPrintLabel={(item) => {
            setDetailItem(null);
            setPrintingItem(item);
          }}
          onEditItem={(item) => {
            if (!currentUser) {
              alert('Silakan login terlebih dahulu untuk mengedit data inventaris.');
              setCurrentView('login');
              return;
            }
            setDetailItem(null);
            setEditingItem(item);
            setIsFormOpen(true);
          }}
          onScanAnother={() => {
            setDetailItem(null);
            setIsScannerOpen(true);
          }}
        />
      )}

      {/* MODAL 3: Print Thermal Label (50x30 mm) */}
      {printingItem && (
        <LabelPrintModal
          item={printingItem}
          onClose={() => setPrintingItem(null)}
        />
      )}

      {/* MODAL 4: Camera QR Scanner */}
      {isScannerOpen && (
        <ScannerModal
          items={items}
          onScanSuccess={handleScanSuccess}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {/* MODAL 5: Single-File HTML Exporter */}
      {isExportHtmlOpen && (
        <ExportHtmlModal onClose={() => setIsExportHtmlOpen(false)} />
      )}
    </div>
  );
}
