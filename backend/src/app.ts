import express from 'express';
import cookieParser from 'cookie-parser';
import { Pool } from 'pg';
import { login } from './routes/auth';
import { authGuard } from './middleware/authGuard';
import { buildTransactionHandlers } from './routes/transactions';
import { buildImportHandlers } from './routes/import';
import { buildFamilyHandlers } from './routes/family';
import { buildTagHandlers } from './routes/tags';
import { buildAssetHandlers } from './routes/assets';
import { accountScopeGuard } from './middleware/accountScopeGuard';
import { startRecurringScheduler } from './services/recurringScheduler';

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(express.json());
app.use(cookieParser());

const txHandlers = buildTransactionHandlers(pool);
const importHandlers = buildImportHandlers(pool);
const familyHandlers = buildFamilyHandlers(pool);
const tagHandlers = buildTagHandlers(pool);
const assetHandlers = buildAssetHandlers(pool);

startRecurringScheduler(pool);
app.post('/api/auth/login', login);
app.post('/api/credit/installments', authGuard, txHandlers.createCreditInstallment);
app.post('/api/import/staging/confirm', authGuard, importHandlers.confirmStaging);

app.post('/api/family/invite', authGuard, accountScopeGuard(pool, 'owner'), familyHandlers.inviteMember);
app.post('/api/family/accept', authGuard, familyHandlers.acceptInvite);
app.get('/api/family/accounts/:accountId/transactions', authGuard, accountScopeGuard(pool), familyHandlers.sharedLedger);
app.get('/api/family/dashboard', authGuard, familyHandlers.sharedDashboard);

app.put('/api/transactions/:transactionId/tags', authGuard, tagHandlers.upsertTransactionTags);
app.get('/api/reports/tags/:tagId/expense', authGuard, tagHandlers.tagExpenseReport);

app.get('/api/assets/:assetId', authGuard, assetHandlers.assetDetail);

export default app;
