
import { MedicationItem } from '../components/types';

export const formatCurrency = (amount: number | string | undefined | null): string => {
  const num = Number(amount);
  if (isNaN(num)) return 'Tk. 0.00';
  // Fix for -0.00 display caused by tiny negative floating point values
  const normalizedNum = Math.abs(num) < 0.001 ? 0 : num;
  return `Tk. ${normalizedNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const getTotalQuantityForMedication = (item: MedicationItem): number => {
  if (!item.batches) return 0;
  return item.batches.reduce((sum, batch) => sum + (Number(batch.quantityInStock) || 0), 0);
};

export const getSoonestExpiryDateForMedication = (item: MedicationItem): string | null => {
  if (!item.batches || item.batches.length === 0) return null;
  
  const activeBatches = item.batches.filter(b => b.quantityInStock > 0 && b.expiryDate);
  if (activeBatches.length === 0) return null;

  // Sort by expiry date ascending
  // Create a copy to avoid mutating the original array
  const sortedBatches = [...activeBatches].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  return sortedBatches[0].expiryDate;
};
