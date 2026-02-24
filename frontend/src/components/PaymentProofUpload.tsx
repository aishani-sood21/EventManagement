import { useState } from 'react';
import api from '../utils/api';
import '../styles/PaymentProofUpload.css';

interface PaymentProofUploadProps {
  registrationId: string;
  onSuccess: () => void;
}

export default function PaymentProofUpload({ registrationId, onSuccess }: PaymentProofUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setMessage('❌ File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setMessage('❌ Please upload an image file');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !preview) {
      setMessage('❌ Please select an image first');
      return;
    }

    try {
      setUploading(true);
      setMessage('');

      await api.post(`/registrations/${registrationId}/payment-proof`, {
        paymentProof: preview // Send base64 image
      });

      setMessage('✅ Payment proof uploaded successfully! Waiting for organizer approval.');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed to upload payment proof'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="payment-proof-upload">
      <h3>📸 Upload Payment Proof</h3>
      <p className="upload-instructions">
        Please upload a clear screenshot or photo of your payment confirmation.
      </p>

      <div className="upload-area">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          id="payment-proof-input"
          className="file-input"
        />
        <label htmlFor="payment-proof-input" className="file-label">
          {preview ? '📷 Change Image' : '📤 Choose Image'}
        </label>

        {preview && (
          <div className="preview-container">
            <img src={preview} alt="Payment proof" className="preview-image" />
          </div>
        )}
      </div>

      {message && (
        <div className={`message ${message.startsWith('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="upload-actions">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="upload-btn"
        >
          {uploading ? '⏳ Uploading...' : '✓ Upload Payment Proof'}
        </button>
      </div>

      <div className="upload-info">
        <p>ℹ️ Supported formats: JPG, PNG, GIF (Max 5MB)</p>
        <p>⏱️ Your order will be processed once the organizer approves your payment.</p>
      </div>
    </div>
  );
}
