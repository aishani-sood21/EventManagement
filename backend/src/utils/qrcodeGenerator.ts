import QRCode from 'qrcode';

export const generateQRCode = async (data: string): Promise<string> => {
  try {
    // Generate QR code as data URL (base64)
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrCodeDataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw new Error('Failed to generate QR code');
  }
};

export const generateTicketQRData = (ticketId: string, eventId: string, participantId: string) => {
  // Create JSON data for QR code
  const qrData = {
    ticketId,
    eventId,
    participantId,
    generatedAt: new Date().toISOString(),
    type: 'EVENT_TICKET'
  };
  
  return JSON.stringify(qrData);
};