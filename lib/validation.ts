
/**
 * Removes all non-digit characters from a phone number except the + sign
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Formats a Chilean phone number for storage in the database
 * Returns format: 56XXXXXXXXX (without the + prefix)
 * 
 * Examples:
 * - "+56959113551" -> "56959113551"
 * - "56959113551" -> "56959113551"
 * - "959113551" -> "56959113551"
 * - "59113551" -> "56959113551"
 */
export function formatPhoneForStorage(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  
  // If starts with +56, remove the + sign
  if (cleaned.startsWith('+56')) {
    return cleaned.substring(1); // Returns: 56XXXXXXXXX
  }
  
  // If already starts with 56 and has correct length, return as is
  if (cleaned.startsWith('56') && cleaned.length >= 10) {
    return cleaned;
  }
  
  // If 9 digits starting with 9, add 56 prefix
  if (cleaned.length === 9 && cleaned.startsWith('9')) {
    return '56' + cleaned;
  }
  
  // If 8 digits, add 569 prefix
  if (cleaned.length === 8) {
    return '569' + cleaned;
  }
  
  return cleaned;
}

/**
 * Validates if a phone number is a valid Chilean mobile number
 * Chilean mobile numbers are 9 digits and start with 9
 */
export function isValidChileanPhone(phone: string): boolean {
  const cleaned = cleanPhoneNumber(phone);
  let phoneDigits = cleaned;
  
  // Remove country code if present
  if (cleaned.startsWith('+56')) {
    phoneDigits = cleaned.substring(3);
  } else if (cleaned.startsWith('56')) {
    phoneDigits = cleaned.substring(2);
  }
  
  // Must be exactly 9 digits and start with 9
  return phoneDigits.length === 9 && phoneDigits.startsWith('9');
}

/**
 * Validates if an email address has a valid format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Translates common error messages to Spanish
 */
export function translateError(error: string): string {
  const translations: Record<string, string> = {
    'User already registered': 'Este email ya está registrado',
    'Invalid email': 'El email no es válido',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
    'Email rate limit exceeded': 'Demasiados intentos. Intenta en unos minutos',
    'Invalid login credentials': 'Email o contraseña incorrectos',
    'Email not confirmed': 'Por favor confirma tu email',
  };
  return translations[error] || error;
}
