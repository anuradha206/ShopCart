/**
 * Indian Rupee (INR) Currency Formatter Utility
 * Formats numbers into standard Indian numbering format (e.g., ₹29,990, ₹1,14,900, ₹1,299)
 */

export const formatINR = (amount: number, showDecimals = false): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
};

export const formatPrice = formatINR;
