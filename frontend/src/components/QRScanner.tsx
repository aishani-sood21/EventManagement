import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../utils/api';
import '../styles/QRScanner.css';

interface QRScannerProps {
  eventId: string;
  onScanSuccess?: (data: any) => void;
}

const QR_ELEMENT_ID = 'qr-reader';

export const QRScanner: React.FC<QRScannerProps> = ({ eventId, onScanSuccess }) => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState('');
  // Store the selected camera id so the effect can use it
  const selectedCameraId = useRef<string | null>(null);
  const html5QrRef = useRef<Html5Qrcode | null>(null);

  // ─── KEY FIX ────────────────────────────────────────────────────────────────
  // Only initialise Html5Qrcode AFTER React has committed the div#qr-reader to
  // the DOM (i.e. after setScanning(true) triggers a re-render + paint).
  useEffect(() => {
    if (!scanning || !selectedCameraId.current) return;

    // Double-check the element really is in the DOM before handing it to the lib
    if (!document.getElementById(QR_ELEMENT_ID)) {
      setCameraError('Scanner element not found. Please try again.');
      setScanning(false);
      return;
    }

    const qr = new Html5Qrcode(QR_ELEMENT_ID);
    html5QrRef.current = qr;

    qr.start(
      selectedCameraId.current,
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
      async (decodedText) => {
        await stopScanner();
        await handleProcess(decodedText, 'qr-camera');
      },
      () => {} // per-frame failure – ignored
    ).catch((e: any) => {
      setScanning(false);
      html5QrRef.current = null;
      const msg = e?.message || '';
      if (/permission|denied|notallowed/i.test(msg)) {
        setCameraError('Camera permission denied. Please allow access in browser settings.');
      } else {
        setCameraError('Could not start camera. Ensure it is not being used by another app.');
      }
    });

    // Cleanup if the component unmounts while scanning
    return () => {
      if (qr.isScanning) {
        qr.stop().catch(() => {});
        qr.clear();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);
  // ────────────────────────────────────────────────────────────────────────────

  const startScanner = async () => {
    setError('');
    setCameraError('');
    setScanResult(null);

    try {
      // 1. Trigger the browser permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());

      // 2. Pick the rear / environment camera if available
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setCameraError('No camera found on this device.');
        return;
      }
      const camera = cameras.find(c => /back|rear|environment/i.test(c.label)) || cameras[0];
      selectedCameraId.current = camera.id;

      // 3. Flip the flag → triggers the useEffect above AFTER the div is in the DOM
      setScanning(true);
    } catch (e: any) {
      const msg = e?.message || '';
      if (/permission|denied|notallowed/i.test(msg)) {
        setCameraError('Camera permission denied. Please allow access in browser settings.');
      } else {
        setCameraError('Could not start camera. Ensure it is not being used by another app.');
      }
    }
  };

  const stopScanner = async () => {
    if (html5QrRef.current) {
      try {
        if (html5QrRef.current.isScanning) await html5QrRef.current.stop();
        html5QrRef.current.clear();
      } catch (_) {}
      html5QrRef.current = null;
    }
    selectedCameraId.current = null;
    setScanning(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const qr = new Html5Qrcode('qr-file-scanner');
      const decoded = await qr.scanFile(file, true);
      qr.clear();
      await handleProcess(decoded, 'qr-upload');
    } catch {
      setError('Could not decode QR from image. Try a clearer photo.');
    }
    e.target.value = '';
  };

  const handleProcess = async (qrData: string, method: string) => {
    try {
      const res = await api.post('/attendance/scan', { qrData, eventId, method });
      setScanResult({ success: true, ...res.data });
      if (onScanSuccess) onScanSuccess(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid Ticket');
    }
  };

  return (
    <div className="qr-scanner-container">
      {/* Hidden div used only for file scanning */}
      <div id="qr-file-scanner" style={{ display: 'none' }} />

      <div className="card" style={{ maxWidth: 500, margin: '0 auto' }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>QR Attendance Scanner</h3>

        {/*
          THE FIX: this div is rendered (and committed to the DOM) whenever
          `scanning` is true — BEFORE the useEffect tries to attach Html5Qrcode.
        */}
        {scanning && (
          <div
            id={QR_ELEMENT_ID}
            style={{
              width: '100%',
              minHeight: '300px',
              background: '#000',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          />
        )}

        {!scanning && !scanResult && (
          <div className="method-selector" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button onClick={startScanner} className="btn-method btn-camera">
              📷 Scan QR
            </button>
            <label className="btn-method btn-upload" style={{ cursor: 'pointer' }}>
              🖼️ Upload Image
              <input type="file" accept="image/*" onChange={handleFileUpload} hidden />
            </label>
          </div>
        )}

        {scanning && (
          <button className="btn-stop" onClick={stopScanner} style={{ marginTop: '20px', width: '100%' }}>
            Stop Camera
          </button>
        )}

        {cameraError && <div className="alert alert-danger" style={{ marginTop: '15px' }}>{cameraError}</div>}
        {error && <div className="alert alert-danger" style={{ marginTop: '15px' }}>{error}</div>}

        {scanResult && (
          <div className="alert alert-success" style={{ marginTop: '15px' }}>
            <h3>✅ Success!</h3>
            <p>Attendance marked for {scanResult.participantName}</p>
            <button onClick={() => setScanResult(null)} style={{ marginTop: '10px' }}>Scan Another</button>
          </div>
        )}
      </div>
    </div>
  );
};