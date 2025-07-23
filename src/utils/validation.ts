import { z } from "zod";

// Input validation schemas
export const MessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message too long (max 4000 characters)')
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, 'Message cannot be empty after trimming'),
});

export const CardDataSchema = z.object({
  id: z.string()
    .min(1, 'Card ID is required')
    .max(100, 'Card ID too long')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Invalid card ID format'),
  name: z.string()
    .min(1, 'Card name is required')
    .max(200, 'Card name too long')
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, 'Card name cannot be empty after trimming'),
  quantity: z.number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(4, 'Quantity cannot exceed 4'),
});

export const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema)
    .min(1, 'At least one message is required')
    .max(50, 'Too many messages (max 50)'),
  selectedCards: z.array(CardDataSchema)
    .max(20, 'Too many cards (max 20)')
    .optional(),
});

// Sanitize search queries
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .slice(0, 200) // Limit length
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .toLowerCase();
}

// Validate search query
export function validateSearchQuery(query: string): boolean {
  if (!query || query.length < 1 || query.length > 200) return false;
  if (/[<>\"'&]/.test(query)) return false; // Contains dangerous characters
  if (query.includes('javascript:') || query.includes('data:')) return false; // Protocol injection
  return true;
}

// TCGdex validation functions
export function validateSetId(setId: string): boolean {
  return /^[A-Z0-9a-z]{1,20}$/.test(setId);
}

export function validateCardId(cardId: string): boolean {
  return /^[A-Z0-9a-z-]{1,50}$/.test(cardId);
}

export function validateLanguage(lang: string): boolean {
  return /^[a-z]{2}$/.test(lang);
}

export function sanitizeParameter(param: string): string {
  return param.trim().slice(0, 50); // Limit length
}

export interface CardData {
  id: string;
  name: string;
  quantity: number;
} 