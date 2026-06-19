export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function isValidChilePhone(phone: string): boolean {
  const digits = normalizePhone(phone);
  return digits.length === 9 && digits.startsWith('9');
}

export function formatPhoneForWhatsApp(phoneNumber: string): string {
  const digitsOnly = phoneNumber.replace(/\D/g, '');

  if (digitsOnly.startsWith('56') && digitsOnly.length >= 10) {
    return digitsOnly;
  }

  if (digitsOnly.length === 9 && digitsOnly.startsWith('9')) {
    return `56${digitsOnly}`;
  }

  if (digitsOnly.length === 8 && digitsOnly.startsWith('9')) {
    return `56${digitsOnly}`;
  }

  if (digitsOnly.length < 9 && digitsOnly.startsWith('9')) {
    return `56${digitsOnly}`;
  }

  if (digitsOnly.length === 9) {
    return `56${digitsOnly}`;
  }

  return digitsOnly;
}

export function formatPhoneDisplay(phone: string): string {
  const digits = normalizePhone(phone);
  if (digits.length === 9) {
    return `${digits.slice(0, 1)} ${digits.slice(1, 5)} ${digits.slice(5)}`;
  }
  return phone;
}
