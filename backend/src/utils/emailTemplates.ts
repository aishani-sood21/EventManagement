export const generateTicketEmail = (
  participantName: string,
  eventName: string,
  ticketId: string,
  eventDate: Date,
  qrCodeUrl: string
) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                  color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; }
        .ticket-box { background: white; padding: 20px; border-radius: 10px; 
                      box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 20px 0; }
        .ticket-id { font-size: 24px; font-weight: bold; color: #667eea; 
                     font-family: monospace; text-align: center; margin: 10px 0; }
        .qr-code { text-align: center; margin: 20px 0; }
        .qr-code img { max-width: 200px; }
        .footer { text-align: center; color: #666; padding: 20px; font-size: 12px; }
        .button { background: #667eea; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 5px; display: inline-block; 
                  margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎫 Event Ticket Confirmation</h1>
          <p>Your registration is confirmed!</p>
        </div>
        
        <div class="content">
          <p>Dear <strong>${participantName}</strong>,</p>
          <p>Thank you for registering for <strong>${eventName}</strong>!</p>
          
          <div class="ticket-box">
            <h2 style="text-align: center; color: #667eea;">Your Ticket</h2>
            <div class="ticket-id">${ticketId}</div>
            
            <div class="qr-code">
              <img src="${qrCodeUrl}" alt="QR Code" />
              <p style="color: #666; font-size: 12px;">Scan this QR code at the venue</p>
            </div>
            
            <table style="width: 100%; margin-top: 20px;">
              <tr>
                <td><strong>Event:</strong></td>
                <td>${eventName}</td>
              </tr>
              <tr>
                <td><strong>Date:</strong></td>
                <td>${new Date(eventDate).toLocaleDateString('en-US', { 
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                })}</td>
              </tr>
              <tr>
                <td><strong>Ticket ID:</strong></td>
                <td>${ticketId}</td>
              </tr>
            </table>
          </div>
          
          <p style="text-align: center;">
            <a href="http://localhost:5173/my-events" class="button">
              View My Events
            </a>
          </p>
          
          <p><strong>Important:</strong></p>
          <ul>
            <li>Please bring this ticket (printed or on your phone) to the event</li>
            <li>Your QR code will be scanned at the venue for entry</li>
            <li>Keep your Ticket ID safe for reference</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
          <p>&copy; 2026 Felicity Event Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateMerchandiseEmail = (
  participantName: string,
  eventName: string,
  ticketId: string,
  items: any[],
  totalAmount: number,
  qrCodeUrl: string
) => {
  const itemsList = items.map(item => 
    `<li>${item.variantName} - Quantity: ${item.quantity} - ₹${item.price * item.quantity}</li>`
  ).join('');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); 
                  color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; }
        .ticket-box { background: white; padding: 20px; border-radius: 10px; 
                      box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 20px 0; }
        .ticket-id { font-size: 24px; font-weight: bold; color: #a855f7; 
                     font-family: monospace; text-align: center; margin: 10px 0; }
        .qr-code { text-align: center; margin: 20px 0; }
        .qr-code img { max-width: 200px; }
        .total { font-size: 20px; font-weight: bold; color: #a855f7; 
                 text-align: right; margin-top: 10px; }
        .footer { text-align: center; color: #666; padding: 20px; font-size: 12px; }
        .button { background: #a855f7; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 5px; display: inline-block; 
                  margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛍️ Purchase Confirmation</h1>
          <p>Your merchandise order is confirmed!</p>
        </div>
        
        <div class="content">
          <p>Dear <strong>${participantName}</strong>,</p>
          <p>Thank you for your purchase from <strong>${eventName}</strong>!</p>
          
          <div class="ticket-box">
            <h2 style="text-align: center; color: #a855f7;">Purchase Receipt</h2>
            <div class="ticket-id">${ticketId}</div>
            
            <div class="qr-code">
              <img src="${qrCodeUrl}" alt="QR Code" />
              <p style="color: #666; font-size: 12px;">Show this QR code for collection</p>
            </div>
            
            <h3>Items Purchased:</h3>
            <ul>${itemsList}</ul>
            <div class="total">Total: ₹${totalAmount}</div>
          </div>
          
          <p style="text-align: center;">
            <a href="http://localhost:5173/my-events" class="button">
              View My Purchases
            </a>
          </p>
          
          <p><strong>Collection Instructions:</strong></p>
          <ul>
            <li>Bring this confirmation email or show the QR code</li>
            <li>Your Ticket ID: <strong>${ticketId}</strong></li>
            <li>Items will be available for collection at the designated counter</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
          <p>&copy; 2026 Felicity Event Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;
};