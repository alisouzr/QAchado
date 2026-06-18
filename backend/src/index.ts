import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import vulnerabilityRoutes from './routes/vulnerability.routes.js';
import reportRoutes from './routes/report.routes.js';
import biRoutes from './routes/bi.routes.js';
import path from 'path';
import cicdRoutes from './routes/cicd.routes.js';

import { injectAuthContext } from './middlewares/context.middleware.js';

const app = express();

app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true,               
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/integrations', cicdRoutes);
app.use(injectAuthContext);
app.use('/api/bi', biRoutes);
app.use('/api/vulnerabilities', vulnerabilityRoutes);
app.use('/api/reports', reportRoutes);
app.use('/uploads', express.static(path.resolve('uploads')));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[SERVER] Security Management API rodando na porta ${PORT}`));