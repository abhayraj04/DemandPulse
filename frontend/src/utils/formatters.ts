/**
 * Indian Rupee (INR ₹) and Numbering System Formatters
 * Handles standard Indian digit grouping (e.g. ₹1,250, ₹25,000, ₹1,50,000, ₹12,50,000, ₹79,68,12,450)
 * and compact Indian representations (Lakhs, Crores).
 */

/**
 * Formats a number into Indian Rupees (INR ₹) with proper Indian comma separation.
 * E.g. 150000 -> "₹1,50,000", 796812450 -> "₹79,68,12,450"
 */
export function formatINR(
  val: number | undefined | null,
  options?: {
    showDecimals?: boolean;
    compact?: boolean;
  }
): string {
  if (val === undefined || val === null || isNaN(val)) {
    return '₹0';
  }

  const { showDecimals = false, compact = false } = options || {};

  if (compact) {
    const absVal = Math.abs(val);
    if (absVal >= 10000000) {
      // Crores (1 Cr = 10,000,000)
      const cr = val / 10000000;
      return `₹${cr.toFixed(2)} Cr`;
    } else if (absVal >= 100000) {
      // Lakhs (1 Lakh = 100,000)
      const lakh = val / 100000;
      return `₹${lakh.toFixed(2)} L`;
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  }).format(val);
}

/**
 * Formats a raw number according to the Indian numbering system without currency symbol.
 * E.g. 150000 -> "1,50,000"
 */
export function formatIndianNumber(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) {
    return '0';
  }
  return new Intl.NumberFormat('en-IN').format(val);
}
