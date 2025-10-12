import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatWorkingDays(sentAt: Date, workingDays: number = 10): Date {
  const tz = 'Europe/Malta';
  const holidays = [
    '2024-01-01', // New Year
    '2024-03-31', // Good Friday
    '2024-04-01', // Easter Monday
    '2024-05-01', // Worker's Day
    '2024-06-07', // Sette Giugno
    '2024-06-29', // St. Peter & St. Paul
    '2024-08-15', // Assumption
    '2024-09-08', // Our Lady of Victories
    '2024-09-21', // Independence Day
    '2024-12-08', // Immaculate Conception
    '2024-12-13', // Republic Day
    '2024-12-25', // Christmas Day
    // Add more holidays as needed
  ];

  let currentDate = new Date(sentAt);
  let daysAdded = 0;

  while (daysAdded < workingDays) {
    currentDate.setDate(currentDate.getDate() + 1);
    
    // Skip weekends
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      continue;
    }
    
    // Skip holidays
    const dateStr = currentDate.toISOString().split('T')[0];
    if (holidays.includes(dateStr)) {
      continue;
    }
    
    daysAdded++;
  }

  // Set to end of day
  currentDate.setHours(23, 59, 59, 999);
  return currentDate;
}

export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

export function validateVATNumber(vat: string): boolean {
  // Basic VAT validation for Malta (MT format)
  if (!vat || typeof vat !== 'string') return false;
  
  // Remove spaces and convert to uppercase
  const cleanVat = vat.replace(/\s/g, '').toUpperCase();
  
  // Malta VAT format: MT + 8 digits
  const mtVatRegex = /^MT\d{8}$/;
  
  if (mtVatRegex.test(cleanVat)) {
    // Basic checksum validation for Malta VAT
    const digits = cleanVat.substring(2);
    const weights = [3, 4, 6, 7, 8, 9, 10, 1];
    let sum = 0;
    
    for (let i = 0; i < 8; i++) {
      sum += parseInt(digits[i]) * weights[i];
    }
    
    const remainder = sum % 37;
    return remainder === 0;
  }
  
  return false;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9.-]/gi, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const ext = getFileExtension(filename);
  return imageExtensions.includes(ext);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
