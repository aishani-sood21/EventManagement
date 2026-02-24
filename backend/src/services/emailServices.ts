import { transporter } from '../config/emailConfig';
import { generateTicketEmail, generateMerchandiseEmail } from '../utils/emailTemplates';
import { generateQRCode, generateTicketQRData } from '../utils/qrcodeGenerator';

export const sendTicketEmail = async (
  participantEmail: string,
  participantName: string,
  eventName: string,
  eventDate: Date,
  ticketId: string,
  eventId: string,
  participantId: string
) => {
  try {
    const qrData = generateTicketQRData(ticketId, eventId, participantId);
    const qrCodeDataUrl = await generateQRCode(qrData);
    
    const emailHtml = generateTicketEmail(
      participantName,
      eventName,
      ticketId,
      eventDate,
      qrCodeDataUrl
    );
    
    // Updated 'from' field to use MailerSend verified sender
    const info = await transporter.sendMail({
      from: `"Felicity Events" <${process.env.EMAIL_USER}>`, 
      to: participantEmail,
      subject: `🎫 Your Ticket for ${eventName}`,
      html: emailHtml
    });
    
    console.log('✅ Ticket email sent via MailerSend:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending ticket email:', error);
    throw error;
  }
};

export const sendMerchandiseEmail = async (
  participantEmail: string,
  participantName: string,
  eventName: string,
  ticketId: string,
  eventId: string,
  participantId: string,
  items: any[],
  totalAmount: number
) => {
  try {
    const qrData = generateTicketQRData(ticketId, eventId, participantId);
    const qrCodeDataUrl = await generateQRCode(qrData);
    
    const emailHtml = generateMerchandiseEmail(
      participantName,
      eventName,
      ticketId,
      items,
      totalAmount,
      qrCodeDataUrl
    );
    
    // Updated 'from' field to use MailerSend verified sender
    const info = await transporter.sendMail({
      from: `"Felicity Merchandise" <${process.env.EMAIL_USER}>`,
      to: participantEmail,
      subject: `🛍️ Purchase Confirmation - ${eventName}`,
      html: emailHtml
    });
    
    console.log('✅ Merchandise email sent via MailerSend:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending merchandise email:', error);
    throw error;
  }
};