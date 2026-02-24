import { useState, useEffect } from 'react';
import api from '../utils/api';

interface SecureImageProps {
  registrationId: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * SecureImage component for displaying payment proof images
 * Fetches signed URLs from backend for secure access to private GCS files
 */
export default function SecureImage({ 
  registrationId, 
  alt = 'Payment Proof', 
  className = '',
  style,
  onClick
}: SecureImageProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const fetchSignedUrl = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await api.get(`/registrations/${registrationId}/payment-proof-url`);
        
        if (isMounted) {
          setImageUrl(response.data.url);
          setLoading(false);

          // If signed URL, refresh before expiry (15 minutes)
          if (response.data.type === 'signed-url') {
            // Refresh URL after 14 minutes (1 minute before expiry)
            const refreshTimeout = setTimeout(() => {
              if (isMounted) {
                fetchSignedUrl();
              }
            }, 14 * 60 * 1000);

            return () => clearTimeout(refreshTimeout);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Error fetching secure image URL:', err);
          setError(err.response?.data?.message || 'Failed to load image');
          setLoading(false);
        }
      }
    };

    fetchSignedUrl();

    return () => {
      isMounted = false;
    };
  }, [registrationId]);

  if (loading) {
    return (
      <div className={`secure-image-loading ${className}`} style={style}>
        <div className="spinner-border spinner-border-sm" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`secure-image-error ${className}`} style={style}>
        <i className="bi bi-exclamation-triangle"></i> {error}
      </div>
    );
  }

  return (
    <img 
      src={imageUrl} 
      alt={alt} 
      className={className}
      style={style}
      onClick={onClick}
      loading="lazy"
    />
  );
}
