import express from 'express';
import cookieParser from 'cookie-parser';
import { Pool } from 'pg';
import { login } from './routes/auth';
import { authGuard } from './middleware/authGuard';
import { buildTransactionHandlers } from './routes/transactions';
import { buildImportHandlers } from './routes/import';

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(express.json());
app.use(cookieParser());

const txHandlers = buildTransactionHandlers(pool);
const importHandlers = buildImportHandlers(pool);
app.post('/api/auth/login', login);
app.post('/api/credit/installments', authGuard, txHandlers.createCreditInstallment);
app.post('/api/import/staging/confirm', authGuard, importHandlers.confirmStaging);

export default app;
