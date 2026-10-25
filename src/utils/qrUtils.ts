/**
 * Utilities for QR Code Generation and Intelligent Scanning / URL Parsing
 */
import { InventoryItem } from '../types.ts';
import { getItemFromFirestore } from '../firebase.ts';
import { INITIAL_ITEMS } from '../mockData.ts';

/**
 * Returns a full URL that can be encoded into QR Codes.
 * When scanned by any smartphone camera app (iOS / Android / Lens),
 * this URL directly opens the web application and loads the item details.
 */
export function getItemScanUrl(itemId: string): string {
  if (typeof window === 'undefined') {
    return itemId;
  }

  try {
    const origin = window.location.origin;
    const pathname = window.location.pathname || '/';
    // Append both search param ?item= and hash #item= for maximum compatibility
    return `${origin}${pathname}?item=${encodeURIComponent(itemId.trim())}`;
  } catch {
    return itemId;
  }
}

/**
 * Robustly parses and extracts the item ID from scanned QR Code raw content.
 * Handles:
 * 1. Full URLs like "https://domain.com/?item=INV-202610-001" or "#item=INV-202610-001"
 * 2. URL paths like "https://domain.com/item/INV-202610-001"
 * 3. Text containing embedded IDs like "Item code: INV-202610-001"
 * 4. Raw IDs like "INV-202610-001"
 * 5. Case-insensitivity, trailing whitespace, or encoded characters
 */
export function extractItemId(rawScannedText: string): string {
  if (!rawScannedText) return '';

  let cleaned = rawScannedText.trim();

  // Strip leading and trailing quotes if any
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // 1. Check if the string is a URL or contains query parameters
  if (cleaned.includes('?') || cleaned.includes('#') || cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    try {
      // Try to parse via URL object
      let urlObj: URL;
      if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
        urlObj = new URL(cleaned);
      } else {
        urlObj = new URL(cleaned, window.location.origin || 'http://localhost:3000');
      }

      // Check search parameters: ?item=, ?id=, ?code=
      const paramItem = urlObj.searchParams.get('item') ||
                        urlObj.searchParams.get('id') ||
                        urlObj.searchParams.get('code') ||
                        urlObj.searchParams.get('inv');
      if (paramItem && paramItem.trim()) {
        return decodeURIComponent(paramItem.trim());
      }

      // Check hash fragment: #item=..., #INV-..., #/item/...
      if (urlObj.hash) {
        const hash = urlObj.hash.replace(/^#\/?/, '');
        if (hash.includes('=')) {
          const hashParams = new URLSearchParams(hash);
          const hashItem = hashParams.get('item') || hashParams.get('id') || hashParams.get('code');
          if (hashItem && hashItem.trim()) {
            return decodeURIComponent(hashItem.trim());
          }
        } else if (hash.startsWith('item/')) {
          return decodeURIComponent(hash.replace('item/', '').trim());
        } else if (/^INV-/i.test(hash)) {
          return decodeURIComponent(hash.trim());
        }
      }
    } catch {
      // Fallback regex if URL parsing fails
    }

    // Regex fallback for ?item= or &item= or ?id=
    const paramRegex = /[?&#](?:item|id|code|inv)=([^&#\s]+)/i;
    const paramMatch = cleaned.match(paramRegex);
    if (paramMatch && paramMatch[1]) {
      return decodeURIComponent(paramMatch[1].trim());
    }
  }

  // 2. Regex search for standard inventory code pattern (e.g. INV-YYYYMM-XXX or INV-...)
  const invCodeRegex = /\b(INV-[A-Za-z0-9\-]+)\b/i;
  const match = cleaned.match(invCodeRegex);
  if (match && match[1]) {
    return match[1].trim();
  }

  // 3. If no URL param or INV- prefix, return the cleaned raw string (decoded)
  try {
    return decodeURIComponent(cleaned);
  } catch {
    return cleaned;
  }
}

/**
 * Searches for an item in existing memory state, Firestore, or fallback mock items.
 */
export async function findInventoryItem(
  rawInput: string,
  localItems: InventoryItem[] = []
): Promise<{ item: InventoryItem | null; extractedId: string }> {
  const extractedId = extractItemId(rawInput);
  if (!extractedId) {
    return { item: null, extractedId: '' };
  }

  const normalizedTarget = extractedId.toLowerCase();

  // 1. Search in local state (items already loaded in memory)
  const localMatch = localItems.find(
    (it) => it.id.toLowerCase() === normalizedTarget || it.name.toLowerCase() === normalizedTarget
  );
  if (localMatch) {
    return { item: localMatch, extractedId };
  }

  // 2. Fetch directly from Firestore (cloud database)
  try {
    const cloudItem = await getItemFromFirestore(extractedId);
    if (cloudItem) {
      return { item: cloudItem, extractedId };
    }
  } catch (err) {
    console.warn('Could not fetch item directly from Firestore:', err);
  }

  // 3. Fallback search in INITIAL_ITEMS (for demo or offline seed state)
  const initialMatch = INITIAL_ITEMS.find(
    (it) => it.id.toLowerCase() === normalizedTarget
  );
  if (initialMatch) {
    return { item: initialMatch, extractedId };
  }

  return { item: null, extractedId };
}
