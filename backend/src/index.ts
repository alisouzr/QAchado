import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import vulnerabilityRoutes from './routes/vulnerability.routes.js';
import reportRoutes from './routes/report.routes.js';
import biRoutes from './routes/bi.routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/bi', biRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/vulnerabilities', vulnerabilityRoutes);
app.use('/api/reports', reportRoutes);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[SERVER] Security Management API rodando na porta ${PORT}`));