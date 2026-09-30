import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { requestId } from './middleware/request-id';
import { errorHandler } from './middleware/error-handler';

// Route imports
import authRoutes from './auth/auth.routes';
import usersRoutes from './users/users.routes';
import teamsRoutes from './teams/teams.routes';
import workItemsRoutes from './work-items/work-items.routes';
import dashboardRoutes from './dashboard/dashboard.routes';

const app = express();

// --- Global Middleware ---

// Security headers
app.use(helmet());

// CORS — allow frontend origin with credentials (cookies)
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// Parse JSON bodies
app.use(express.json({ limit: '1mb' }));

// Parse cookies (for JWT httpOnly cookie)
app.use(cookieParser());

// Request ID for log correlation
app.use(requestId);

// --- Routes ---

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/work-items', workItemsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Global Error Handler (must be last) ---
app.use(errorHandler);

export default app;
