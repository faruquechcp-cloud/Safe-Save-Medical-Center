
import { GoogleGenAI } from "@google/genai";
import { Customer, NotificationSettings } from "../types";

/**
 * Utility to send notifications via Email, SMS (Gateway), and WhatsApp (Deep Link).
 */

export async function sendCustomerNotification(
  type: 'sale' | 'payment' | 'due_reminder',
  customer: Customer,
  details: { amount: number; invoiceNo?: string; due?: number },
  settings: NotificationSettings,
  preferredChannel?: 'sms' | 'email' | 'whatsapp' | 'messenger'
) {
  // 1. Check Global Triggers (only if no preferred channel is specified)
  if (!preferredChannel) {
    if (type === 'sale' && !settings.alertOnSale) return;
    if ((type === 'payment' || type === 'due_reminder') && !settings.alertOnDuePayment) return;
  }

  const isOnline = navigator.onLine;
  if (!isOnline && (settings.smsEnabled || settings.emailEnabled)) {
      console.warn("Offline: Cannot send automated SMS/Email.");
  }

  let messageBody = getDefaultMessage(type, customer, details);

  // 2. Generate Content using Gemini (only if online and enabled)
  if (settings.useSmartAI && isOnline && process.env.API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Draft a professional and warm ${type === 'sale' ? 'purchase thank you' : (type === 'payment' ? 'payment receipt confirmation' : 'payment reminder')} for a pharmacy customer.
      Customer Name: ${customer.name}
      Transaction Details: Tk. ${details.amount.toFixed(2)}
      ${details.invoiceNo ? `Invoice: ${details.invoiceNo}` : ''}
      ${details.due !== undefined ? `Current Outstanding Balance: Tk. ${details.due.toFixed(2)}` : ''}
      The tone should be professional yet caring. Keep it extremely concise (under 160 characters for SMS). 
      Format: Return ONLY the message body text.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      if (response.text) messageBody = response.text;
    } catch (error) {
      // Fallback silently to default message
    }
  }

  // 3. Send SMS (Requires Gateway)
  const shouldSendSMS = preferredChannel === 'sms' || (!preferredChannel && settings.smsEnabled);
  if (shouldSendSMS && customer.phone && settings.smsGatewayUrl && settings.smsApiKey && isOnline) {
    try {
        const url = new URL(settings.smsGatewayUrl);
        // Common params for generic gateways
        url.searchParams.append('api_key', settings.smsApiKey);
        url.searchParams.append('to', customer.phone.replace(/\D/g, '')); 
        url.searchParams.append('message', messageBody);
        url.searchParams.append('sender_id', settings.smsSenderId);
        
        // Non-blocking fetch
        fetch(url.toString(), { method: 'GET' }).catch(err => console.error("SMS Fetch Error", err));
    } catch (error) {
        console.error("SMS setup failed", error);
    }
  }

  // 4. Send Email (EmailJS)
  const shouldSendEmail = preferredChannel === 'email' || (!preferredChannel && settings.emailEnabled);
  if (shouldSendEmail && customer.email && settings.emailPublicKey && isOnline) {
    try {
        const emailData = {
            service_id: settings.emailServiceId,
            template_id: settings.emailTemplateId,
            user_id: settings.emailPublicKey,
            template_params: {
                to_name: customer.name,
                to_email: customer.email,
                message: messageBody,
                invoice_no: details.invoiceNo || 'N/A'
            }
        };

        fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData)
        }).catch(err => console.error("Email Fetch Error", err));
    } catch (error) {
        console.error("Email setup failed", error);
    }
  }

  // 5. WhatsApp (Client-side Trigger)
  const shouldSendWhatsApp = preferredChannel === 'whatsapp' || (!preferredChannel && settings.whatsappEnabled);
  if (shouldSendWhatsApp && customer.phone) {
      const cleanPhone = customer.phone.replace(/\D/g, '');
      // Ensure country code if missing (defaulting to BD +880)
      const formattedPhone = cleanPhone.startsWith('880') ? cleanPhone : (cleanPhone.startsWith('01') ? `88${cleanPhone}` : cleanPhone);
      
      const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageBody)}`;
      
      // Open in a new window/tab. 
      window.open(waUrl, '_blank');
  }

  // 6. Messenger (Client-side Trigger)
  const shouldSendMessenger = preferredChannel === 'messenger' || (!preferredChannel && settings.messengerEnabled);
  if (shouldSendMessenger) {
      window.open('https://www.facebook.com/messages/t/', '_blank');
  }
}

function getDefaultMessage(type: string, customer: Customer, details: any): string {
    const amount = details.amount.toFixed(2);
    switch(type) {
        case 'sale':
            return `Dear ${customer.name}, Thank you for purchasing from SafeSave! Amount: Tk.${amount}. Inv: ${details.invoiceNo}.`;
        case 'payment':
            return `Received payment of Tk.${amount} from ${customer.name}. Balance: Tk.${details.due?.toFixed(2)}. Thanks!`;
        case 'due_reminder':
            return `Reminder: Dear ${customer.name}, you have a due balance of Tk.${details.amount.toFixed(2)} at SafeSave. Please settle soon.`;
        default:
            return "Notification from SafeSave Medical.";
    }
}
