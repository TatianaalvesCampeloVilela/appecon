import { EntryType, LedgerEntry } from '@appecon/shared';

export interface RawDocumentLine {
  date: string;
  amount: number;
  description: string;
  accountHint?: string;
}

const revenueKeywords = ['payment received', 'bank transfer received', 'invoice paid'];
const transferKeywords = ['internal transfer', 'account transfer'];

export function classifyEntryType(description: string): EntryType {
  const text = description.toLowerCase();
  if (revenueKeywords.some((keyword) => text.includes(keyword))) return 'revenue';
  if (transferKeywords.some((keyword) => text.includes(keyword))) return 'transfer';
  return 'expense';
}

export function toLedgerEntry(line: RawDocumentLine, defaultBankAccount: string): Omit<LedgerEntry, 'id'> {
  return {
    date: line.date,
    amount: Math.abs(line.amount),
    description: line.description,
    category: 'uncategorized',
    bankAccount: line.accountHint ?? defaultBankAccount,
    type: classifyEntryType(line.description),
    importedFrom: 'pdf'
  };
}
