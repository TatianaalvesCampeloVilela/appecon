export type EntryType = 'revenue' | 'expense' | 'transfer' | 'tax' | 'fee' | 'royalty';

export interface LedgerEntry {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  bankAccount: string;
  type: EntryType;
  importedFrom?: 'pdf' | 'xlsx' | 'ods' | 'manual' | 'credit_card';
  linkedBankEntryId?: string;
}

export interface ExecutiveMetrics {
  revenue: number;
  totalExpenses: number;
  taxes: number;
  contributionMargin: number;
  netProfit: number;
}
