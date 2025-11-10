/**
 * Currency formatting utilities for GBC Kitchen App
 * 
 * Handles conversion from minor units (pence) to major units (pounds)
 * and proper formatting for display across the application.
 */

/**
 * Format currency value from minor units (pence) to major units (pounds)
 * 
 * @param value - Value in minor units (pence), e.g., 11305
 * @param showSymbol - Whether to include the £ symbol (default: true)
 * @returns Formatted currency string, e.g., "£113.05"
 * 
 * Examples:
 * - formatCurrency(11305) → "£113.05"
 * - formatCurrency(2708) → "£27.08"
 * - formatCurrency(0) → "£0.00"
 * - formatCurrency(11305, false) → "113.05"
 */
export function formatCurrency(value: number, showSymbol: boolean = true): string {
  // Handle null/undefined values
  if (value == null || isNaN(value)) {
    return showSymbol ? '£0.00' : '0.00';
  }

  // Convert from minor units (pence) to major units (pounds)
  const pounds = value / 100;
  
  // Format to exactly 2 decimal places
  const formatted = pounds.toFixed(2);
  
  // Return with or without currency symbol
  return showSymbol ? `£${formatted}` : formatted;
}

/**
 * Format currency value that's already in major units (pounds)
 * 
 * @param value - Value in major units (pounds), e.g., 113.05
 * @param showSymbol - Whether to include the £ symbol (default: true)
 * @returns Formatted currency string, e.g., "£113.05"
 * 
 * Use this for values that are already in pounds and just need formatting
 */
export function formatCurrencyMajor(value: number, showSymbol: boolean = true): string {
  // Handle null/undefined values
  if (value == null || isNaN(value)) {
    return showSymbol ? '£0.00' : '0.00';
  }

  // Format to exactly 2 decimal places
  const formatted = value.toFixed(2);
  
  // Return with or without currency symbol
  return showSymbol ? `£${formatted}` : formatted;
}

/**
 * Parse currency string back to minor units (pence)
 * 
 * @param currencyString - Currency string like "£113.05" or "113.05"
 * @returns Value in minor units (pence), e.g., 11305
 */
export function parseCurrencyToMinor(currencyString: string): number {
  // Remove currency symbol and any whitespace
  const cleanString = currencyString.replace(/[£\s]/g, '');
  
  // Parse as float and convert to minor units
  const pounds = parseFloat(cleanString);
  
  if (isNaN(pounds)) {
    return 0;
  }
  
  // Convert to minor units (pence) and round to avoid floating point issues
  return Math.round(pounds * 100);
}

/**
 * Determine if a value is likely in minor units (pence) or major units (pounds)
 *
 * @param value - Numeric value to check
 * @returns true if likely in minor units, false if likely in major units
 *
 * Enhanced heuristic:
 * - Values over 1000 are likely in pence
 * - Values that are whole numbers over 100 are likely in pence
 * - Values with decimals are likely in pounds
 */
export function isLikelyMinorUnits(value: number): boolean {
  // Values over 1000 are definitely in pence (e.g., 11305 pence = £113.05)
  if (value > 1000) {
    return true;
  }

  // Values between 100-1000 that are whole numbers are likely in pence
  // (e.g., 250 pence = £2.50, 350 pence = £3.50)
  if (value >= 100 && value <= 1000 && value % 1 === 0) {
    return true;
  }

  // Values with decimals or under 100 are likely in pounds
  return false;
}

/**
 * Smart currency formatter that auto-detects units and formats appropriately
 *
 * @param value - Value that might be in pence or pounds
 * @param showSymbol - Whether to include the £ symbol (default: true)
 * @returns Formatted currency string
 *
 * This function tries to detect if the value is in minor or major units
 * and formats accordingly. Use with caution - prefer explicit formatCurrency
 * or formatCurrencyMajor when you know the input format.
 */
export function smartFormatCurrency(value: number, showSymbol: boolean = true): string {
  if (isLikelyMinorUnits(value)) {
    return formatCurrency(value, showSymbol);
  } else {
    return formatCurrencyMajor(value, showSymbol);
  }
}

/**
 * Format currency for order display - handles mixed data sources intelligently
 *
 * @param value - Price value from order data (could be string or number, pence or pounds)
 * @param showSymbol - Whether to include the £ symbol (default: true)
 * @returns Formatted currency string
 *
 * This function is specifically designed for order data where prices might come
 * from different sources (website payload vs legacy data) in different formats.
 */
export function formatOrderPrice(value: string | number | undefined | null, showSymbol: boolean = true): string {
  // Handle null/undefined values
  if (value == null) {
    return showSymbol ? '£0.00' : '0.00';
  }

  // Convert string to number if needed
  let numericValue: number;
  if (typeof value === 'string') {
    // Remove any currency symbols and whitespace
    const cleanString = value.replace(/[£\s]/g, '');
    numericValue = parseFloat(cleanString);

    if (isNaN(numericValue)) {
      return showSymbol ? '£0.00' : '0.00';
    }
  } else {
    numericValue = value;
  }

  // Use smart detection to determine if it's pence or pounds
  return smartFormatCurrency(numericValue, showSymbol);
}

/**
 * Extract discount value from order data with proper fallback
 *
 * @param orderData - Order object that might contain discount information
 * @returns Discount value in pounds (0 if not found)
 */
export function extractDiscountValue(orderData: any): number {
  // Check for new payload format discount
  if (orderData.totals && orderData.totals.discount) {
    const discountValue = parseFloat(orderData.totals.discount);
    return isNaN(discountValue) ? 0 : discountValue;
  }

  // Check for legacy discount field
  if (orderData.discount != null) {
    let discountValue = typeof orderData.discount === 'string'
      ? parseFloat(orderData.discount)
      : orderData.discount;

    if (isNaN(discountValue)) {
      return 0;
    }

    // Apply smart conversion for legacy data
    if (isLikelyMinorUnits(discountValue)) {
      discountValue = discountValue / 100;
    }

    return discountValue;
  }

  // Default to 0 if no discount found
  return 0;
}

/**
 * Extract subtotal value from order data with proper fallback
 *
 * @param orderData - Order object that might contain subtotal information
 * @returns Subtotal value in pounds
 */
export function extractSubtotalValue(orderData: any): number {
  // Check for new payload format subtotal
  if (orderData.totals && orderData.totals.subtotal) {
    const subtotalValue = parseFloat(orderData.totals.subtotal);
    return isNaN(subtotalValue) ? orderData.amount || 0 : subtotalValue;
  }

  // Check for legacy subtotal field
  if (orderData.subtotal != null) {
    const subtotalValue = typeof orderData.subtotal === 'string'
      ? parseFloat(orderData.subtotal)
      : orderData.subtotal;
    return isNaN(subtotalValue) ? orderData.amount || 0 : subtotalValue;
  }

  // Fallback to total amount
  return orderData.amount || orderData.total || 0;
}
