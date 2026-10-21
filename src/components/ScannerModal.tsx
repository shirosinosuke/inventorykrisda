import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, RefreshCw, AlertCircle, Sparkles, Volume2, Search, Check } from 'lucide-react';
import { InventoryItem } from '../types.ts';

interface ScannerModalProps {
  items: InventoryItem[];
  onScanSuccess: (code: string) => void;
  onClose: () => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  items,
  onScanSuccess,
  onClose,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isStartedRef = useRef<boolean>(false);

  // Play pleasant beep sound using Web Audio API
  const playBeep = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Audio might be blocked if user hasn't interacted
    }
  }, []);

  const handleDetected = useCallback((decodedText: string) => {
    playBeep();
    // Stop scanning cleanly before closing
    if (html5QrCodeRef.current && isStartedRef.current) {
      html5QrCodeRef.current
        .stop()
        .then(() => {
          isStartedRef.current = false;
          setIsScanning(false);
          onScanSuccess(decodedText.trim());
        })
        .catch(() => {
          onScanSuccess(decodedText.trim());
        });
    } else {
      onScanSuccess(decodedText.trim());
    }
  }, [playBeep, onScanSuccess]);

  // Start the scanner
  const startScanner = useCallback(async (cameraIdToUse?: string) => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader-container');
      }

      if (isStartedRef.current) {
        await html5QrCodeRef.current.stop();
        isStartedRef.current = false;
      }

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 160 },
        aspectRatio: 1.333333,
      };

      const cameraParam = cameraIdToUse
        ? { deviceId: { exact: cameraIdToUse } }
        : { facingMode: 'environment' };

      await html5QrCodeRef.current.start(
        cameraParam,
        config,
        (decodedText) => {
          handleDetected(decodedText);
        },
        () => {
          // ignore transient frame decode errors
        }
      );

      isStartedRef.current = true;
      setIsScanning(true);
    } catch (err: unknown) {
      console.warn('Camera start error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setCameraError(
        `Kamera tidak dapat diakses (${errMsg}). Anda tetap dapat menggunakan input manual atau simulasi scanner di bawah ini.`
      );
      setIsScanning(false);
      isStartedRef.current = false;
    }
  }, [handleDetected]);

  // Stop scanner
  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current && isStartedRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      } finally {
        isStartedRef.current = false;
        setIsScanning(false);
      }
    }
  }, []);

  // Initialize camera list and start
  useEffect(() => {
    let isMounted = true;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMounted) return;
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera if available
          const backCam = devices.find(
            (c) =>
              c.label.toLowerCase().includes('back') ||
              c.label.toLowerCase().includes('belakang') ||
              c.label.toLowerCase().includes('environment')
          );
          const defaultId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(defaultId);
          startScanner(defaultId);
        } else {
          startScanner();
        }
      })
      .catch((err) => {
        console.warn('Error getting cameras:', err);
        // Fallback to auto environment facing mode
        startScanner();
      });

    return () => {
      isMounted = false;
      if (html5QrCodeRef.current && isStartedRef.current) {
        html5QrCodeRef.current
          .stop()
          .catch((e) => console.warn(e))
          .finally(() => {
            isStartedRef.current = false;
          });
      }
    };
  }, [startScanner]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    playBeep();
    stopScanner();
    onScanSuccess(manualCode.trim());
  };

  const handleSelectQuickTest = (id: string) => {
    playBeep();
    stopScanner();
    onScanSuccess(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Pemindai Barcode / QR</h3>
              <p className="text-xs text-slate-300">Arahkan kamera ke barcode atau ketik ID barang</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Camera Viewport Container */}
          <div className="relative bg-black rounded-xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center min-h-[260px]">
            <div id="qr-reader-container" className="w-full h-full min-h-[250px]" />

            {/* Scanner target overlay animation */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-64 h-36 border-2 border-dashed border-emerald-400/90 rounded-lg relative shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                  {/* Scanning beam line */}
                  <div className="absolute left-0 right-0 h-0.5 bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                </div>
                <span className="mt-3 text-[11px] font-medium text-white/80 bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                  Arahkan barcode ke dalam kotak
                </span>
              </div>
            )}

            {/* Error fallback message if camera fails */}
            {cameraError && (
              <div className="p-5 text-center text-slate-300 space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-xs leading-relaxed text-amber-200">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => startScanner(selectedCameraId)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Coba Lagi
                </button>
              </div>
            )}
          </div>

          {/* Camera switcher if multiple cameras are detected */}
          {cameras.length > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <span className="font-medium text-slate-700">Pilih Perangkat Kamera:</span>
              <select
                value={selectedCameraId}
                onChange={(e) => {
                  setSelectedCameraId(e.target.value);
                  startScanner(e.target.value);
                }}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {cameras.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Kamera ${cam.id.slice(0, 5)}...`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Manual Input (Support for Hardware Barcode Scanners / Typing) */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="manual-barcode-input" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-indigo-600" />
                Input Manual / Scanner Gun (USB / BT)
              </label>
              <span className="text-[10px] text-slate-400">Tekan Enter untuk cari</span>
            </div>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                id="manual-barcode-input"
                type="text"
                placeholder="Contoh: INV-202610-001"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Periksa
              </button>
            </form>
          </div>

          {/* Quick Simulation / Demo items */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Simulasi Uji Coba Cepat (Klik salah satu):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {items.slice(0, 4).map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => handleSelectQuickTest(it.id)}
                  className="px-2.5 py-1 text-[11px] font-mono font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-md transition-colors text-slate-700 cursor-pointer"
                  title={it.name}
                >
                  {it.id} ({it.name.split(' ')[0]})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Suara 'beep' aktif saat terdeteksi</span>
          </div>
          <button
            type="button"
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
