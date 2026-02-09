const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';
export async function fetchEntries() {
    const response = await fetch(`${apiUrl}/entries`);
    return response.json();
}
export async function createEntry(payload) {
    const response = await fetch(`${apiUrl}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    return response.json();
}
export async function fetchDashboard() {
    const response = await fetch(`${apiUrl}/reports/dashboard`);
    return response.json();
}
export async function fetchInsights() {
    const response = await fetch(`${apiUrl}/reports/ai-insights`);
    return response.json();
}
