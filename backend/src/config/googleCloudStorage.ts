import { Storage } from '@google-cloud/storage';
import path from 'path';

// Initialize Google Cloud Storage
// You'll need to set up:
// 1. Create a GCS bucket in Google Cloud Console
// 2. Download service account key JSON file
// 3. Set environment variables or provide path to key file

const storage = new Storage({
  // Option 1: Use service account key file (recommended for development)
  keyFilename: process.env.GCS_KEY_FILE || path.join(__dirname, '../../gcs-key.json'),
  
  // Option 2: Use environment variables (recommended for production)
  // projectId: process.env.GCS_PROJECT_ID,
  // credentials: {
  //   client_email: process.env.GCS_CLIENT_EMAIL,
  //   private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  // },
});

const bucketName = process.env.GCS_BUCKET_NAME || 'eventhub-payment-proofs';
const bucket = storage.bucket(bucketName);

/**
 * Upload a file to Google Cloud Storage
 * @param file - File buffer or base64 string
 * @param filename - Name for the file in GCS
 * @returns GCS path (gs://bucket/path) for private storage
 */
export async function uploadToGCS(file: Buffer | string, filename: string): Promise<string> {
  try {
    let buffer: Buffer;

    // Handle base64 string
    if (typeof file === 'string') {
      // Remove data:image/xxx;base64, prefix if present
      const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      buffer = file;
    }

    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const gcsFilename = `payment-proofs/${timestamp}-${sanitizedFilename}`;

    // Upload to GCS
    const blob = bucket.file(gcsFilename);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: 'image/jpeg', // Adjust based on actual file type
        cacheControl: 'private, max-age=300', // Private cache for 5 minutes
      },
      resumable: false,
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => {
        console.error('GCS upload error:', err);
        reject(err);
      });

      blobStream.on('finish', async () => {
        // DO NOT make the file public - we'll use signed URLs for security
        // Store the GCS path (not a public URL)
        const gcsPath = `gs://${bucketName}/${gcsFilename}`;
        resolve(gcsPath);
      });

      blobStream.end(buffer);
    });
  } catch (error) {
    console.error('Error uploading to GCS:', error);
    throw new Error('Failed to upload file to Google Cloud Storage');
  }
}

/**
 * Delete a file from Google Cloud Storage
 * @param gcsPath - GCS path (gs://bucket/path) or public URL
 */
export async function deleteFromGCS(gcsPath: string): Promise<void> {
  try {
    // Extract filename from GCS path or URL
    let filename: string;
    if (gcsPath.startsWith('gs://')) {
      filename = gcsPath.split(`${bucketName}/`)[1];
    } else if (gcsPath.includes('storage.googleapis.com')) {
      filename = gcsPath.split(`${bucketName}/`)[1];
    } else {
      filename = gcsPath;
    }
    
    if (!filename) {
      throw new Error('Invalid file path');
    }

    await bucket.file(filename).delete();
    console.log(`Deleted file: ${filename}`);
  } catch (error) {
    console.error('Error deleting from GCS:', error);
    // Don't throw error - deletion failure shouldn't block the main operation
  }
}

/**
 * Check if GCS is properly configured
 */
export async function checkGCSConnection(): Promise<boolean> {
  try {
    await bucket.exists();
    console.log('✅ Google Cloud Storage connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Google Cloud Storage connection failed:', error);
    console.log('💡 Falling back to base64 storage in database');
    return false;
  }
}

/**
 * Generate a signed URL for private file access
 * @param gcsPath - GCS path (gs://bucket/path/to/file) or just the filename
 * @param expiresInMinutes - How long the URL should be valid (default: 15 minutes)
 * @returns Signed URL that expires after the specified time
 */
export async function getSignedUrl(gcsPath: string, expiresInMinutes: number = 15): Promise<string> {
  try {
    // Extract filename from GCS path
    let filename: string;
    if (gcsPath.startsWith('gs://')) {
      // Format: gs://bucket-name/path/to/file
      filename = gcsPath.split(`${bucketName}/`)[1];
    } else if (gcsPath.includes('storage.googleapis.com')) {
      // Format: https://storage.googleapis.com/bucket-name/path/to/file
      filename = gcsPath.split(`${bucketName}/`)[1];
    } else {
      // Already just the filename
      filename = gcsPath;
    }

    if (!filename) {
      throw new Error('Invalid GCS path');
    }

    const options = {
      version: 'v4' as const,
      action: 'read' as const,
      expires: Date.now() + expiresInMinutes * 60 * 1000, // Convert minutes to milliseconds
    };

    // Generate signed URL
    const [url] = await bucket.file(filename).getSignedUrl(options);
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate signed URL');
  }
}

export default storage;

