import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { FinanceService } from './modules/finance-service.js';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
});
const finance = new FinanceService()
const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173'


const entrySchema = z.object({
  date: z.string(),
  amount: z.number().positive(),
  description: z.string().min(2),
  category: z.string().min(2),
  bankAccount: z.string().min(2),
  type: z.enum(['revenue', 'expense', 'transfer', 'tax', 'fee', 'royalty']),
  importedFrom: z.enum(['pdf', 'xlsx', 'ods', 'manual', 'credit_card']).optional(),
  linkedBankEntryId: z.string().optional()
});

app.get('/health', async () => ({ status: 'ok' }));
app.get('/entries', async () => finance.getEntries());

app.post('/entries', async (request, reply) => {
  const parsed = entrySchema.parse(request.body);
  const created = finance.addEntry({ ...parsed, importedFrom: parsed.importedFrom ?? 'manual' });
  reply.code(201).send(created);
});

app.put('/entries/:id', async (request, reply) => {
  const params = z.object({ id: z.string().uuid() }).parse(request.params);
  const payload = entrySchema.partial().parse(request.body);
  const updated = finance.updateEntry(params.id, payload);
  if (!updated) return reply.code(404).send({ message: 'Entry not found' });
  return updated;
});

app.delete('/entries/:id', async (request, reply) => {
  const params = z.object({ id: z.string().uuid() }).parse(request.params);
  const removed = finance.deleteEntry(params.id);
  return reply.code(removed ? 204 : 404).send();
});

app.post('/import', async (request) => {
  const payload = z
    .object({
      source: z.enum(['pdf', 'xlsx', 'ods', 'credit_card']),
      entries: z.array(entrySchema.omit({ linkedBankEntryId: true }))
    })
    .parse(request.body);

  return finance.importData(payload);
});

app.get('/reports/cashflow-operational', async () => finance.getOperatingCashflow());
app.get('/reports/cashflow-by-account', async () => finance.getCashflowByAccount());
app.get('/reports/dashboard', async () => finance.getExecutiveMetrics());
app.get('/reports/ai-insights', async () => finance.getAiInsights());

const port = Number(process.env.PORT ?? 3333);
const host = process.env.HOST ?? '0.0.0.0';
await app.listen({ port, host });

