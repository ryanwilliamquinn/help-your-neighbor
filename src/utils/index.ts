// Utility functions for Help Your Neighbor application

import DOMPurify from 'dompurify';

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const isDateExpired = (date: Date): boolean => {
  return date < new Date();
};

export const generateToken = (): string => {
  // Use crypto.randomUUID() for cryptographically secure tokens
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers - use crypto.getRandomValues()
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
      ''
    );
  }

  // Final fallback (should not be used in production)
  // eslint-disable-next-line no-console
  console.warn('Using insecure token generation - crypto API not available');
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone);
};

// Comprehensive input sanitization using DOMPurify
export const sanitizeInput = (input: string): string => {
  if (!input) return '';

  // First trim and clean basic input
  const trimmed = input.trim();

  // Use DOMPurify to sanitize HTML and prevent XSS
  const sanitized = DOMPurify.sanitize(trimmed, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No HTML attributes allowed
    KEEP_CONTENT: true, // Keep text content but remove tags
  });

  return sanitized;
};

// Sanitize HTML content (for rich text if needed in future)
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
};

// Sanitize for display in React components
export const sanitizeForDisplay = (input: string): string => {
  if (!input) return '';

  // Remove any potential script content and HTML
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  }).trim();
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};
