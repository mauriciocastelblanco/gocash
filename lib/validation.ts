
/**
 * Validation utilities for user input
 */

/**
 * Validates if an email address is in a valid format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates if a phone number is a valid Chilean phone number
 * Chilean mobile numbers are 9 digits and start with 9
 */
export function isValidChileanPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length === 9 && cleanPhone.startsWith('9');
}

/**
 * Formats a phone number for storage by removing all non-digit characters
 */
export function formatPhoneForStorage(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Translates common Supabase error messages to Spanish
 */
export function translateError(error: string): string {
  const errorMap: { [key: string]: string } = {
    'User already registered': 'Este email ya está registrado',
    'Invalid email': 'Email inválido',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
    'Email rate limit exceeded': 'Demasiados intentos. Por favor intenta más tarde.',
    'Invalid login credentials': 'Email o contraseña incorrectos',
    'Email not confirmed': 'Por favor confirma tu email antes de iniciar sesión',
  };
  
  return errorMap[error] || error;
}
