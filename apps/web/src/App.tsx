import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import type { EntryType, ExecutiveMetrics, LedgerEntry } from '@appecon/shared';
import { createEntry, fetchDashboard, fetchEntries, fetchInsights } from './services/api';

interface AiInsights {
  summary: string;
  opportunities: string[];
  risks: string[];
}

const defaultEntry: Omit<LedgerEntry, 'id'> = {
  date: new Date().toISOString().slice(0, 10),
  amount: 0,
  description: '',
  category: 'uncategorized',
  bankAccount: 'Main Account',
  type: 'expense',
  importedFrom: 'manual'
};

export function App() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [insights, setInsights] = useState<AiInsights | null>(null);
  const [form, setForm] = useState(defaultEntry);

  async function loadData() {
    const [entryData, dashboardData, aiData] = await Promise.all([fetchEntries(), fetchDashboard(), fetchInsights()]);
    setEntries(entryData);
    setMetrics(dashboardData);
    setInsights(aiData);
  }

  useEffect(() => {
    void loadData();
  }, []);

  const expensesByCategory = useMemo(() => {
    const totals = new Map<string, number>();
    entries.forEach((entry) => {
      if (entry.type !== 'revenue') totals.set(entry.category, (totals.get(entry.category) ?? 0) + entry.amount);
    });
    return Array.from(totals.entries()).map(([category, total]) => ({ category, total }));
  }, [entries]);

  const profitTrend = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    let balance = 0;
    return sorted.map((entry) => {
      balance += entry.type === 'revenue' ? entry.amount : -entry.amount;
      return { date: entry.date, profit: Number(balance.toFixed(2)) };
    });
  }, [entries]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await createEntry(form);
    setForm(defaultEntry);
    await loadData();
  }

  return (
    <div className="page">
      <header>
        <h1>Appeco • P&L and Smart Cashflow</h1>
      </header>

      <section className="cards">
        {[
          ['Revenue', metrics?.revenue ?? 0],
          ['Total Expenses', metrics?.totalExpenses ?? 0],
          ['Taxes', metrics?.taxes ?? 0],
          ['Contribution Margin (%)', metrics?.contributionMargin ?? 0],
          ['Net Profit', metrics?.netProfit ?? 0]
        ].map(([label, value]) => (
          <article key={label} className="card">
            <span>{label}</span>
            <strong>{typeof value === 'number' ? value.toFixed(2) : value}</strong>
          </article>
        ))}
      </section>

      <main className="grid">
        <section className="panel">
          <h2>New Ledger Entry</h2>
          <form onSubmit={onSubmit} className="form">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} placeholder="Amount" required />
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" required />
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" required />
            <input value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} placeholder="Bank Account" required />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as EntryType })}>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
              <option value="tax">Tax</option>
              <option value="fee">Fee</option>
              <option value="royalty">Royalty</option>
            </select>
            <button type="submit">Save Entry</button>
          </form>
        </section>

        <section className="panel">
          <h2>Expense Distribution by Category</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={expensesByCategory}>
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#2663ff" />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="panel">
          <h2>Profit Trend</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={profitTrend}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line dataKey="profit" stroke="#00a76f" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </section>

        <section className="panel">
          <h2>AI Insights</h2>
          <p>{insights?.summary}</p>
          <ul>
            {(insights?.opportunities ?? []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <small>{(insights?.risks ?? []).join(' ')}</small>
        </section>
      </main>
    </div>
  );
}
