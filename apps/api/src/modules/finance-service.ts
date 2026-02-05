import dayjs from 'dayjs';
import { v4 as uuid } from 'uuid';
import { ExecutiveMetrics, EntryType, LedgerEntry } from '@appecon/shared';

interface ImportRecord {
  source: 'pdf' | 'xlsx' | 'ods' | 'credit_card';
  entries: Omit<LedgerEntry, 'id'>[];
}

const operatingExpenseTypes: EntryType[] = ['expense', 'tax', 'fee', 'royalty'];

export class FinanceService {
  private entries: LedgerEntry[] = [];
  private categoryHints = new Map<string, string>();

  getEntries() {
    return this.entries.sort((a, b) => a.date.localeCompare(b.date));
  }

  addEntry(entry: Omit<LedgerEntry, 'id'>) {
    const suggestedCategory = this.suggestCategory(entry.description, entry.category);
    const newEntry: LedgerEntry = { ...entry, id: uuid(), category: suggestedCategory };
    this.entries.push(newEntry);
    this.learnCategory(newEntry.description, newEntry.category);
    return newEntry;
  }

  updateEntry(id: string, changes: Partial<Omit<LedgerEntry, 'id'>>) {
    const index = this.entries.findIndex((entry) => entry.id === id);
    if (index < 0) return null;

    this.entries[index] = { ...this.entries[index], ...changes };
    this.learnCategory(this.entries[index].description, this.entries[index].category);
    return this.entries[index];
  }

  deleteEntry(id: string) {
    const initialLength = this.entries.length;
    this.entries = this.entries.filter((entry) => entry.id !== id);
    return initialLength !== this.entries.length;
  }

  importData({ source, entries }: ImportRecord) {
    const imported: LedgerEntry[] = [];

    for (const entry of entries) {
      if (source === 'credit_card') {
        const duplicate = this.findPotentialDuplicate(entry);
        const enriched: LedgerEntry = {
          ...entry,
          id: uuid(),
          importedFrom: source,
          linkedBankEntryId: duplicate?.id,
          category: this.suggestCategory(entry.description, entry.category)
        };
        imported.push(enriched);
        if (!duplicate) {
          this.entries.push(enriched);
        }
      } else {
        const enriched: LedgerEntry = {
          ...entry,
          id: uuid(),
          importedFrom: source,
          category: this.suggestCategory(entry.description, entry.category)
        };
        imported.push(enriched);
        this.entries.push(enriched);
      }
    }

    return {
      imported,
      duplicatesDetected: imported.filter((item) => item.linkedBankEntryId).length
    };
  }

  getOperatingCashflow() {
    return this.entries
      .filter((entry) => entry.type === 'revenue' || entry.type === 'expense')
      .map((entry) => ({
        ...entry,
        signedAmount: entry.type === 'revenue' ? entry.amount : -entry.amount
      }));
  }

  getCashflowByAccount() {
    const grouped = new Map<string, { account: string; totalIn: number; totalOut: number; net: number }>();

    for (const entry of this.entries) {
      if (entry.type === 'transfer') continue;
      const current = grouped.get(entry.bankAccount) ?? {
        account: entry.bankAccount,
        totalIn: 0,
        totalOut: 0,
        net: 0
      };
      if (entry.type === 'revenue') current.totalIn += entry.amount;
      else current.totalOut += entry.amount;
      current.net = current.totalIn - current.totalOut;
      grouped.set(entry.bankAccount, current);
    }

    return Array.from(grouped.values());
  }

  getExecutiveMetrics(): ExecutiveMetrics {
    let revenue = 0;
    let totalExpenses = 0;
    let taxes = 0;

    for (const entry of this.entries) {
      if (entry.type === 'revenue') revenue += entry.amount;
      if (operatingExpenseTypes.includes(entry.type)) totalExpenses += entry.amount;
      if (entry.type === 'tax') taxes += entry.amount;
    }

    const contributionMargin = revenue === 0 ? 0 : Number((((revenue - totalExpenses) / revenue) * 100).toFixed(2));
    const netProfit = revenue - totalExpenses;

    return { revenue, totalExpenses, taxes, contributionMargin, netProfit };
  }

  getAiInsights() {
    const expenses = this.entries.filter((entry) => operatingExpenseTypes.includes(entry.type));
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalsByCategory = new Map<string, number>();

    for (const item of expenses) {
      totalsByCategory.set(item.category, (totalsByCategory.get(item.category) ?? 0) + item.amount);
    }

    const rankedCostCenters = Array.from(totalsByCategory.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses ? Number(((amount / totalExpenses) * 100).toFixed(2)) : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    const topCostCenters = rankedCostCenters.slice(0, 3);

    return {
      topCostCenters,
      opportunities: topCostCenters.map((item) =>
        item.percentage > 25
          ? `${item.category} represents ${item.percentage}% of expenses. Review contracts and consumption targets.`
          : `Monitor ${item.category} (USD-equivalent ${item.amount.toFixed(2)}) to keep spending stable.`
      ),
      risks: this.detectRiskSignals(),
      summary:
        topCostCenters.length === 0
          ? 'No sufficient data available yet for automated recommendations.'
          : `Current top cost centers: ${topCostCenters.map((item) => item.category).join(', ')}.`
    };
  }

  private detectRiskSignals() {
    const now = dayjs();
    const recentEntries = this.entries.filter((entry) => dayjs(entry.date).isAfter(now.subtract(60, 'day')));
    const revenue = recentEntries
      .filter((entry) => entry.type === 'revenue')
      .reduce((sum, item) => sum + item.amount, 0);
    const expenses = recentEntries
      .filter((entry) => operatingExpenseTypes.includes(entry.type))
      .reduce((sum, item) => sum + item.amount, 0);

    if (revenue === 0 && expenses > 0) return ['No revenue in the recent period: critical cash risk.'];
    if (expenses > revenue) return ['Expenses exceeded revenue in the last 60 days: review cost structure.'];
    if (revenue > 0 && expenses / revenue > 0.85) return ['Expenses are above 85% of revenue: margin at risk.'];

    return ['Financial risk is currently controlled for the analyzed period.'];
  }

  private findPotentialDuplicate(entry: Omit<LedgerEntry, 'id'>) {
    return this.entries.find((existing) => {
      if (!['expense', 'fee', 'tax'].includes(existing.type)) return false;
      const hasSimilarValue = Math.abs(existing.amount - entry.amount) < 0.05;
      const hasCloseDate = Math.abs(dayjs(existing.date).diff(dayjs(entry.date), 'day')) <= 4;
      const hasSimilarDescription = this.textSimilarity(existing.description, entry.description) >= 0.55;
      return hasSimilarValue && hasCloseDate && hasSimilarDescription;
    });
  }

  private suggestCategory(description: string, fallback: string) {
    const normalizedDescription = description.toLowerCase().trim();
    return this.categoryHints.get(normalizedDescription) ?? fallback;
  }

  private learnCategory(description: string, category: string) {
    this.categoryHints.set(description.toLowerCase().trim(), category);
  }

  private textSimilarity(firstText: string, secondText: string) {
    const firstTokens = new Set(firstText.toLowerCase().split(/\s+/));
    const secondTokens = new Set(secondText.toLowerCase().split(/\s+/));
    const intersection = [...firstTokens].filter((token) => secondTokens.has(token)).length;
    const union = new Set([...firstTokens, ...secondTokens]).size;
    return union === 0 ? 0 : intersection / union;
  }
}
