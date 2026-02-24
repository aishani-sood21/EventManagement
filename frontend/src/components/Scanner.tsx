import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../utils/api';
import '../styles/QRScanner.css';

interface QRScannerProps {
  eventId: string;
  onScanSuccess?: (data: any) => void;
}

export const Scanner: React.FC<QRScannerProps> = ({ eventId, onScanSuccess }) => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const readerDivId = 'qr-reader';

  // ─── KEY FIX ──────────────────────────────────────────────────────────────
  // We must NOT call new Html5Qrcode() until AFTER React has committed the
  // div#qr-reader to the DOM. That only happens after setScanning(true)
  // triggers a re-render. So we run the camera init inside a useEffect that
  // watches `scanning` — by which point the div is guaranteed to exist.
  useEffect(() => {
    if (!scanning) return;

    // Safety check — element must exist before we hand it to the library
    if (!document.getElementById(readerDivId)) {
      setCameraError('Scanner element not found. Please try again.');
      setScanning(false);
      return;
    }

    let qr: Html5Qrcode;

    const start = async () => {
      try {
        qr = new Html5Qrcode(readerDivId);
        html5QrCodeRef.current = qr;

        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          setCameraError('No cameras found. Please check camera permissions.');
          setScanning(false);
          return;
        }

        // Prefer rear/environment camera on mobile
        const camera =
          devices.find(d => /back|rear|environment/i.test(d.label)) || devices[0];

        await qr.start(
          camera.id,
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          onScanSuccessHandler,
          () => {} // per-frame failures are normal — ignore
        );

        console.log('✅ Camera started successfully');
      } catch (err: any) {
        console.error('Error starting camera:', err);
        setCameraError(
          `Camera error: ${err.message || 'Failed to start camera'}. Please allow camera access in your browser.`
        );
        setScanning(false);
        html5QrCodeRef.current = null;
      }
    };

    start();

    // Cleanup: stop camera if component unmounts while scanning
    return () => {
      if (qr) {
        try {
          if (qr.getState() === 2) qr.stop().catch(() => {});
          qr.clear();
        } catch (_) {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);
  // ──────────────────────────────────────────────────────────────────────────

  const onScanSuccessHandler = async (decodedText: string, _decodedResult: any) => {
    console.log('QR Code scanned:', decodedText);
    await stopCamera();
    await processQRCode(decodedText, 'qr-camera');
  };

  const processQRCode = async (qrData: string, scanMethod: string) => {
    try {
      setError('');
      const response = await api.post('/attendance/scan', {
        qrData,
        eventId,
        method: scanMethod,
      });

      setScanResult({ success: true, ...response.data });
      if (onScanSuccess) onScanSuccess(response.data);

      setTimeout(() => setScanResult(null), 5000);
    } catch (err: any) {
      console.error('Error processing QR code:', err);

      const errorData = err.response?.data;
      const errorType = errorData?.error;
      let errorMessage = errorData?.message || 'Failed to process QR code';

      if (errorType === 'DUPLICATE_SCAN') {
        errorMessage = `❌ Already scanned! This ticket was scanned on ${new Date(errorData.attendanceTimestamp).toLocaleString()}`;
      } else if (errorType === 'INVALID_STATUS') {
        errorMessage = `❌ Invalid ticket! Status: ${errorData.status}`;
      } else if (errorType === 'PAYMENT_NOT_APPROVED') {
        errorMessage = '❌ Payment not approved for this merchandise order';
      } else if (errorType === 'TICKET_NOT_FOUND') {
        errorMessage = '❌ Invalid ticket! Not found in database';
      } else if (errorType === 'UNAUTHORIZED_EVENT') {
        errorMessage = "❌ This ticket is for a different organizer's event";
      }

      setError(errorMessage);
      setScanResult({ success: false, message: errorMessage });
      setTimeout(() => { setError(''); setScanResult(null); }, 10000);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      setScanResult(null);
      const tempScanner = new Html5Qrcode('temp-qr-reader');
      const result = await tempScanner.scanFile(file, false);
      tempScanner.clear();
      console.log('QR Code from file:', result);
      await processQRCode(result, 'qr-upload');
    } catch (err: any) {
      console.error('Error reading QR from file:', err);
      setError('Failed to read QR code from image. Please ensure the image contains a clear, valid QR code.');
    }

    event.target.value = '';
  };

  // startCamera now ONLY sets state — the useEffect does the rest
  const startCamera = () => {
    setScanning(true);
    setError('');
    setScanResult(null);
    setCameraError('');
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.getState() === 2) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
        console.log('✅ Camera stopped');
      } catch (err) {
        console.error('Error stopping camera:', err);
      }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  };

  return (
    <div className="qr-scanner-container">
      <div className="scanner-header">
        <h3>📷 QR Code Scanner</h3>
        <p className="text-muted">Scan participant QR codes to mark attendance</p>
      </div>

      {/* Method Selection */}
      {!scanning && !scanResult && (
        <div className="method-selector">
          <button onClick={startCamera} className="btn-method btn-camera">
            <i className="bi bi-camera-fill"></i>
            <span>Scan with Camera</span>
          </button>

          <div className="divider">OR</div>

          <label className="btn-method btn-upload">
            <i className="bi bi-upload"></i>
            <span>Upload QR Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}

      {/* Camera Error */}
      {cameraError && (
        <div className="alert alert-danger">
          {cameraError}
          <button
            onClick={() => setCameraError('')}
            style={{ marginLeft: '1rem', padding: '0.25rem 0.75rem' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Camera Scanner — div#qr-reader MUST be in the DOM before Html5Qrcode
          initialises. Rendering it here (when scanning=true) guarantees that. */}
      {scanning && !cameraError && (
        <div className="scanner-camera">
          <div id={readerDivId} style={{ width: '100%' }}></div>
          <button onClick={stopCamera} className="btn-stop">
            Stop Camera
          </button>
        </div>
      )}

      {/* Scan Result */}
      {scanResult && (
        <div className={`scan-result ${scanResult.success ? 'success' : 'error'}`}>
          {scanResult.success ? (
            <>
              <div className="result-icon">✅</div>
              <h3>Attendance Marked!</h3>
              <div className="result-details">
                <p><strong>Participant:</strong> {scanResult.data?.participantName}</p>
                <p><strong>Email:</strong> {scanResult.data?.participantEmail}</p>
                <p><strong>Ticket ID:</strong> {scanResult.data?.ticketId}</p>
                <p><strong>Time:</strong> {new Date(scanResult.data?.attendanceTimestamp).toLocaleString()}</p>
              </div>
              <button
                onClick={() => { setScanResult(null); setError(''); }}
                className="btn-scan-another"
              >
                Scan Another
              </button>
            </>
          ) : (
            <>
              <div className="result-icon">❌</div>
              <h3>Scan Failed</h3>
              <p className="error-message">{scanResult.message}</p>
              <button
                onClick={() => { setScanResult(null); setError(''); }}
                className="btn-scan-another"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && !scanResult && (
        <div className="alert alert-danger">{error}</div>
      )}

      {/* Hidden div for file scanning */}
      <div id="temp-qr-reader" style={{ display: 'none' }}></div>
    </div>
  );
};