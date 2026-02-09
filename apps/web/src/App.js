import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { createEntry, fetchDashboard, fetchEntries, fetchInsights } from './services/api';
const defaultEntry = {
    date: new Date().toISOString().slice(0, 10),
    amount: 0,
    description: '',
    category: 'uncategorized',
    bankAccount: 'Main Account',
    type: 'expense',
    importedFrom: 'manual'
};
export function App() {
    const [entries, setEntries] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [insights, setInsights] = useState(null);
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
        const totals = new Map();
        entries.forEach((entry) => {
            if (entry.type !== 'revenue')
                totals.set(entry.category, (totals.get(entry.category) ?? 0) + entry.amount);
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
    async function onSubmit(event) {
        event.preventDefault();
        await createEntry(form);
        setForm(defaultEntry);
        await loadData();
    }
    return (_jsxs("div", { className: "page", children: [_jsx("header", { children: _jsx("h1", { children: "Appeco \u2022 P&L and Smart Cashflow" }) }), _jsx("section", { className: "cards", children: [
                    ['Revenue', metrics?.revenue ?? 0],
                    ['Total Expenses', metrics?.totalExpenses ?? 0],
                    ['Taxes', metrics?.taxes ?? 0],
                    ['Contribution Margin (%)', metrics?.contributionMargin ?? 0],
                    ['Net Profit', metrics?.netProfit ?? 0]
                ].map(([label, value]) => (_jsxs("article", { className: "card", children: [_jsx("span", { children: label }), _jsx("strong", { children: typeof value === 'number' ? value.toFixed(2) : value })] }, label))) }), _jsxs("main", { className: "grid", children: [_jsxs("section", { className: "panel", children: [_jsx("h2", { children: "New Ledger Entry" }), _jsxs("form", { onSubmit: onSubmit, className: "form", children: [_jsx("input", { type: "date", value: form.date, onChange: (e) => setForm({ ...form, date: e.target.value }), required: true }), _jsx("input", { type: "number", value: form.amount, onChange: (e) => setForm({ ...form, amount: Number(e.target.value) }), placeholder: "Amount", required: true }), _jsx("input", { value: form.description, onChange: (e) => setForm({ ...form, description: e.target.value }), placeholder: "Description", required: true }), _jsx("input", { value: form.category, onChange: (e) => setForm({ ...form, category: e.target.value }), placeholder: "Category", required: true }), _jsx("input", { value: form.bankAccount, onChange: (e) => setForm({ ...form, bankAccount: e.target.value }), placeholder: "Bank Account", required: true }), _jsxs("select", { value: form.type, onChange: (e) => setForm({ ...form, type: e.target.value }), children: [_jsx("option", { value: "revenue", children: "Revenue" }), _jsx("option", { value: "expense", children: "Expense" }), _jsx("option", { value: "transfer", children: "Transfer" }), _jsx("option", { value: "tax", children: "Tax" }), _jsx("option", { value: "fee", children: "Fee" }), _jsx("option", { value: "royalty", children: "Royalty" })] }), _jsx("button", { type: "submit", children: "Save Entry" })] })] }), _jsxs("section", { className: "panel", children: [_jsx("h2", { children: "Expense Distribution by Category" }), _jsx(ResponsiveContainer, { width: "100%", height: 240, children: _jsxs(BarChart, { data: expensesByCategory, children: [_jsx(XAxis, { dataKey: "category" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "total", fill: "#2663ff" })] }) })] }), _jsxs("section", { className: "panel", children: [_jsx("h2", { children: "Profit Trend" }), _jsx(ResponsiveContainer, { width: "100%", height: 240, children: _jsxs(LineChart, { data: profitTrend, children: [_jsx(XAxis, { dataKey: "date" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Line, { dataKey: "profit", stroke: "#00a76f", strokeWidth: 3 })] }) })] }), _jsxs("section", { className: "panel", children: [_jsx("h2", { children: "AI Insights" }), _jsx("p", { children: insights?.summary }), _jsx("ul", { children: (insights?.opportunities ?? []).map((item) => (_jsx("li", { children: item }, item))) }), _jsx("small", { children: (insights?.risks ?? []).join(' ') })] })] })] }));
}
