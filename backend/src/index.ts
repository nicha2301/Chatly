import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import cookieParser from 'cookie-parser';
import connectDB from './config/db';
import connectRedis from './config/redis';
import initFirebase from './config/firebase';
import { createDefaultRoles } from './models/Role';
import routes from './routes';
import { notFound, errorHandler } from './middleware/errorMiddleware';
import { initSocketServer } from './socket';

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
connectDB().then(async () => {
  // Create default roles after successful DB connection
  await createDefaultRoles();
});

// Connect to Redis if enabled
connectRedis().then((client) => {
  if (client) {
    console.log('Redis connected successfully');
  }
});

// Initialize Firebase
initFirebase();

// Create Express app
const app: Express = express();
const port = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocketServer(server);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Chatly API',
    version: '1.0.0',
    status: 'running'
  });
});

// API routes
app.use('/api', routes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
server.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  console.log(`🔌 Socket.IO initialized`);
});

export default app; 