import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import winston from 'winston';
import adminRoutes from './routes/acadamic/admin/adminRoutes.js';
// import authRoutes from './routes/auth/authRoutes.js';
import departmentRoutes from './routes/acadamic/departmentRoutes.js';
import staffRoutes from './routes/acadamic/staff/staffRoutes.js';
import attendanceRoutes from './routes/acadamic/staff/staffattendanceroutes.js';
import adminattendance from './routes/acadamic/admin/adminattendanceroutes.js';
import attendanceReportRoutes from './routes/acadamic/admin/attendanceReportRoutes.js'
import studentRoutes from './routes/acadamic/student/studentRoutes.js';
import verticalRoutes from './routes/acadamic/admin/verticalRoutes.js';
import cbcsRouter from './routes/acadamic/cbcsRoutes.js';
import companyRoutes from './routes/acadamic/companyRoutes.js';
import roleRoutes from './routes/acadamic/roleRoutes.js'
import userRoutes from './routes/acadamic/userRoutes.js'
import sanitizeInput from './middlewares/sanitizeInput.js';
import csrfProtection from './middlewares/csrfProtection.js';

dotenv.config({ path: './config.env' });

const app = express();

// Trust proxy settings for Express to work correctly behind reverse proxies (Nginx/ALB/Cloudflare)
app.set('trust proxy', true);

// Structured logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// HTTPS redirection is disabled in Express because SSL termination is handled by the 
// reverse proxy (Nginx/Cloudflare). Enabling redirection here causes redirect loops 
// when the proxy communicates with Express over HTTP without forwarding the protocol headers.
/*
app.use((req, res, next) => {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  if (!isHttps && process.env.NODE_ENV === 'production') {
    return res.redirect(301, `https://${req.get('host')}${req.url}`);
  }
  next();
});
*/

// CORS (moved early)
// CORS Configuration (consolidated)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean);
    const isLocalhost = /^http:\/\/localhost:517[3-9]$/.test(origin);
    
    if (isLocalhost || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'CSRF-Token'],
  maxAge: 600,
  optionsSuccessStatus: 204
}));

app.options('*', cors());

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5600', 'https://erp.nec.edu.in/institute_management_system'],
      imgSrc: ["'self'", 'data:']
    }
  }
}));

// Cookie parser (early for sessions)
app.use(cookieParser());

// Body parsing (before rate limit) - CRITICAL FIX: Use rawBody for potential proxy issues, but mainly disable sanitization on body fields
app.use(express.json({ limit: '10mb', verify: (req, res, buf) => { req.rawBody = buf; } })); // Preserve raw for debugging
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => true,
  message: { status: 'error', message: 'Too many requests, try again later.' },
  handler: (req, res, _next, options) => {
    logger.warn({ message: 'Rate limit exceeded', ip: req.ip, url: req.url });
    res.status(429).json(options.message);
  }
});
app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => true,
  message: { status: 'error', message: 'Too many authentication attempts, try again later.' },
});

app.use('/institute_management_system/auth/login', authLimiter);
app.use('/institute_management_system/auth/google-login', authLimiter);

app.use(csrfProtection);

// Routes (apply limiter only where needed; remove from bulk routes if batching)
// NOTE: Auth limiter commented out above, so removed from here
// app.use('/institute_management_system/auth', sanitizeInput, authRoutes);
app.use('/institute_management_system/companies', sanitizeInput, companyRoutes);
app.use('/institute_management_system/roles', sanitizeInput, roleRoutes);
app.use('/institute_management_system/users', sanitizeInput, userRoutes);
app.use('/institute_management_system/admin', sanitizeInput, adminRoutes); // No global limiter here if bulk
app.use('/institute_management_system/departments', sanitizeInput, departmentRoutes);
app.use('/institute_management_system/staff', sanitizeInput, staffRoutes);
app.use('/institute_management_system/staff/attendance', sanitizeInput, attendanceRoutes);
app.use('/api/staff/attendance', sanitizeInput, attendanceRoutes);
app.use('/institute_management_system/admin/attendance', sanitizeInput, adminattendance);
app.use("/institute_management_system/admin/attendanceReports", attendanceReportRoutes);
app.use('/institute_management_system/student', sanitizeInput, studentRoutes);
app.use('/institute_management_system/admin', sanitizeInput, verticalRoutes);
app.use('/institute_management_system/cbcs', cbcsRouter);

// Removed duplicate CORS header overrides (handled by cors middleware)

// Health check
app.get('/institute_management_system/health', (req, res) => {
  res.json({ status: 'success', message: 'Server running' });
});

// Error handling
app.use((err, req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, CSRF-Token');
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ status: 'error', message: 'Invalid CSRF token' });
  }
  res.status(500).json({ status: 'error', message: err.message || 'Something went wrong!' });
});

export default app;

