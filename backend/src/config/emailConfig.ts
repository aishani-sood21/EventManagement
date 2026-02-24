import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Explicitly call config to ensure variables are loaded
dotenv.config();

console.log('--- Email Config Check ---');
console.log('Host:', process.env.EMAIL_HOST); // Should NOT be undefined
console.log('User:', process.env.EMAIL_USER);

export const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.mailersend.net', 
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    // Adding this helps prevent local connection attempts
    debug: false,
    logger: false 
});

transporter.verify((err, success) => {
    if (err) {
        console.log('❌ Connection failed. Check if .env variables match your MailerSend Dashboard.');
        console.error(err);
    } else {
        console.log('🚀 MailerSend SMTP server is ready');
    }
});