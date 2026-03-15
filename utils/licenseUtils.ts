
import { LicenseDuration } from '../types';

// SECRET KEY FOR SIGNATURES
const SECRET_SALT = "SAFE_SAVE_MEDICAL_SECURE_KEY_2024_HARDWARE_LOCKED";

interface DecodedLicense {
  type: LicenseDuration;
  expiryDate: string; // YYYY-MM-DD or 'LIFETIME'
  systemId: string;   // The locked hardware ID
  generatedAt: number;
}

export const validateLicenseKey = (key: string, currentSystemId: string): { valid: boolean; info?: DecodedLicense; error?: string } => {
  try {
    const decodedString = atob(key);
    const data = JSON.parse(decodedString);

    if (!data.type || !data.expiryDate || !data.signature || !data.generatedAt || !data.systemId) {
      return { valid: false, error: "লাইসেন্স ফরম্যাট সঠিক নয়।" };
    }

    if (data.systemId !== currentSystemId) {
        return { valid: false, error: "এই লাইসেন্সটি অন্য একটি ডিভাইসের জন্য বরাদ্দ।" };
    }

    const expectedSignature = generateSignature(data.type, data.expiryDate, data.systemId, data.generatedAt);
    
    if (data.signature !== expectedSignature) {
      return { valid: false, error: "লাইসেন্স সিগনেচারটি সঠিক নয়।" };
    }

    return { 
      valid: true, 
      info: {
        type: data.type,
        expiryDate: data.expiryDate,
        systemId: data.systemId,
        generatedAt: data.generatedAt
      }
    };

  } catch (e) {
    return { valid: false, error: "লাইসেন্স কি-টি ত্রুটিপূর্ণ।" };
  }
};

export const isLicenseActive = (expiryDate: string | null): boolean => {
  if (expiryDate === 'LIFETIME' || expiryDate === null) return true;
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const expiry = new Date(expiryDate);
  expiry.setHours(0,0,0,0);
  
  // তারিখ যদি আজকের চেয়ে ছোট হয়, তবেই এটি ইন-অ্যাক্টিভ (false)
  return expiry.getTime() >= today.getTime();
};

export const generateLicenseKey = (duration: LicenseDuration, targetSystemId: string): string => {
  const generatedAt = Date.now();
  let expiryDate = '';
  const today = new Date();
  
  switch (duration) {
    case '1Y': today.setFullYear(today.getFullYear() + 1); break;
    case '2Y': today.setFullYear(today.getFullYear() + 2); break;
    case '3Y': today.setFullYear(today.getFullYear() + 3); break;
    case '5Y': today.setFullYear(today.getFullYear() + 5); break;
    case '10Y': today.setFullYear(today.getFullYear() + 10); break;
    case 'LIFETIME': expiryDate = 'LIFETIME'; break;
    default: today.setDate(today.getDate() + 7);
  }

  if (expiryDate !== 'LIFETIME') {
    expiryDate = today.toISOString().split('T')[0];
  }

  const signature = generateSignature(duration, expiryDate, targetSystemId, generatedAt);
  const payload = {
    type: duration,
    expiryDate: expiryDate,
    systemId: targetSystemId,
    generatedAt: generatedAt,
    signature: signature
  };

  return btoa(JSON.stringify(payload));
};

const generateSignature = (type: string, expiry: string, sysId: string, genAt: number) => {
  const raw = `${type}|${expiry}|${sysId}|${genAt}|${SECRET_SALT}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};
