import express from 'express';
import { connectDB, sequelize } from './config/mysql.js';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import multer from 'multer';
import nodemailer from 'nodemailer';
import bodyParser from 'body-parser';
import { applyAssociations } from './models/index.js';
import cookieParser from 'cookie-parser';


// Import Routes
import leaveRoutes from './routes/student/leaveRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/admin/adminRoutes.js';
import tableRoutes from './routes/admin/tableRoutes.js';
import internRoutes from './routes/student/internshipRoutes.js';
import dashboardRoutes from './routes/student/DashboardRoutes.js';
import bulkRoutes from "./routes/admin/bulkRoutes.js";
import studentRoutes from "./routes/student/studentRoutes.js"
import locationRoutes from './routes/student/locationRoutes.js';
import activityRoutes from "./routes/admin/activityRoutes.js";
import ScholarshipRoutes from './routes/student/ScholarshipRoutes.js';
import eventRoutes from './routes/student/eventRoutes.js'
import eventAttendedRoutes from './routes/student/eventAttendedRoutes.js';
import OnlineCoursesRoutes from './routes/student/onlinecourseRoute.js'
import achievementRoutes from './routes/student/achievementRoutes.js'
import courseRoutes from './routes/student/CourseRoutes.js';
import biodataRoutes from './routes/student/bioDataRoutes.js';
import hackathonRoutes from './routes/student/hackathonRouts.js';
import extracurricularRoutes from "./routes/student/extracurricularRoutes.js";
import projectRoutes from "./routes/student/projectRoutes.js";
import publicationRoutes from "./routes/student/studentPublicationRoutes.js";
import nonCGPACategoryRoutes from "./routes/admin/nonCGPACategoryRoutes.js";
import CompetencyCoding from "./routes/student/competencyCodingRoutes.js";
import Noncgpa from "./routes/student/studentNonCGPARoutes.js";

import studentPdfRoutes from './routes/student/studentPdfRoutes.js';
// import skillRackRoutes from './routes/skillRackRoutes.js';

import certificationRoutes from './routes/staff/certificationRoutes.js';
import bookChapterRoutes from './routes/staff/bookChaptersRoutes.js';
import hIndexRoutes from './routes/staff/hindexRoutes.js';
import proposalsRoutes from './routes/staff/proposalRoutes.js';
import resourcePersonRoutes from './routes/staff/resourcePersonRoutes.js';
import seedMoneyRoutes from './routes/staff/seedMoneyRoutes.js';
import recognitionRoutes from './routes/staff/recognitionRoutes.js';
import patentProductRoutes from './routes/staff/patentProductRoutes.js';
import projectMentorRoutes from './routes/staff/projectMentorRoutes.js';
import ScholarRoutes from './routes/staff/scholarRoutes.js';
import projectProposalRoutes from './routes/staff/fundedProjectRoutes.js';
import mouRoutes from './routes/staff/mouRoutes.js';
import StudentEducationRoutes from "./routes/student/educationRoutes.js";
import resumeGeneratorRoutes from "./routes/student/resumeGeneratorRoutes.js";
import resumeStaffRoutes from './routes/staff/resumeStaff.js';

import adminPanelRoutes from './routes/adminPanelRoutes.js';
import staffIndustryRoutes from './routes/staff/industryRoutes.js';
import staffEventsRoutes from './routes/staff/eventsRoutes.js';
import staffEventsOrganizedRoutes from './routes/staff/eventsOrganizedRoutes.js';
import studentPanelRoutes from './routes/admin/studentPanelRoutes.js';
import certificateRoutes from "./routes/student/certificateRoutes.js";
import marksheetRoutes from "./routes/student/marksheetRoutes.js";

import PersonalInfo from './routes/staff/personalRoutes.js';


import skillrackRoutes from "./routes/student/skillrackRoutes.js";

// Activity Module Routes
import activityModuleRoutes from './routes/staff/activityRoutes.js';
import staffEventAttendedRoutes from './routes/staff/staffEventAttendedRoutes.js';
import activityApprovalRoutes from './routes/admin/activityApprovalRoutes.js';
import tlpRoutes from './routes/staff/tlpRoutes.js';
import tlpApprovalRoutes from './routes/admin/tlpApprovalRoutes.js';
import tlpPublicRoutes from './routes/public/tlpPublicRoutes.js';
import tlpCommentRoutes from './routes/public/tlpCommentRoutes.js';
import tlpCommentAdminRoutes from './routes/admin/tlpCommentAdminRoutes.js';


import adminRoleRoutes from './routes/adminRoutes.js';
import educationRoutes from './routes/staff/educationRoutes.js';

import placementMainRoutes from './routes/placement/index.js';

//Acadamic
import { initDatabase } from './models/acadamic/index.js';
import AcadamicApp from './app.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Apply model associations
applyAssociations();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MySQL Connection Pool - EXPORTED for use in routes
export const pool = mysql.createPool({
  host: process.env.DB_HOST ,
  user: process.env.DB_USER ,
  password: process.env.DB_PASSWORD ,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Keep db as alias for backwards compatibility
const db = pool;

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password',
  },
});

// Base multer setup for general file uploads
const baseStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'Uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});

const baseFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, and PDF files are allowed.'), false);
  }
  cb(null, true);
};

const baseUpload = multer({ storage: baseStorage, fileFilter: baseFileFilter });

// Feedback-specific multer setup
const feedbackStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'Uploads/feedback/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const feedbackFileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only PDF, JPEG, and PNG files are allowed.'), false);
  }
  cb(null, true);
};

const feedbackUpload = multer({ storage: feedbackStorage, fileFilter: feedbackFileFilter });

//Acadamic

const startServer = async () => {
  // Initialize Academic DB (errors are non-fatal — server will still start)
  await initDatabase().catch(err => {
    console.warn('⚠️ Academic DB init warning (server will still start):', err.message);
  });

  // Academic app routes are mounted as middleware below.
};

startServer();

// middlewares
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Request logging middlewares
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Test database connection
async function testConnection() {
  try {
    const connection = await db.getConnection();
    console.log('✅ MySQL database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL database connection failed:', error.message);
    return false;
  }
}


// Route Registration
app.use(AcadamicApp); // Mount academic app routes and middlewares to the main app
app.use('/api/placement', placementMainRoutes);

app.use('/api', dashboardRoutes);
app.use("/api/hackathon", hackathonRoutes);
app.use('/api', authRoutes);
app.use('/api', adminRoutes);
app.use('/api', tableRoutes);
app.use('/api', internRoutes);
app.use("/api/bulk", bulkRoutes);
// NOTE: studentPdfRoutes should come AFTER studentRoutes to avoid route conflicts
// studentRoutes handles /api/student (GET) and /api/student/update (PUT)
// studentPdfRoutes handles /api/student/generate-pdf/:userId, /api/student/view-pdf/:userId, /api/student/data/:userId
app.use("/api", studentRoutes);

app.use('/api/student', studentPdfRoutes);
app.use('/api/education', educationRoutes);
app.use("/api/staff", PersonalInfo);
app.use('/api/auth', authRoutes);

app.use('/api/certifications', certificationRoutes);
app.use('/api/book-chapters', bookChapterRoutes);
app.use('/api/h-index', hIndexRoutes);
app.use('/api/proposals', proposalsRoutes);
app.use('/api/resource-person', resourcePersonRoutes);
app.use('/api/seed-money', seedMoneyRoutes);
app.use('/api/recognition', recognitionRoutes);
app.use('/api/patent-product', patentProductRoutes);
app.use('/api/project-mentors', projectMentorRoutes);
app.use('/api/scholars', ScholarRoutes);
app.use('/api/project-proposal', projectProposalRoutes); // also handles /api/project-proposal/payment/*
app.use("/api/skillrack", skillrackRoutes);
app.use("/api/student-education", StudentEducationRoutes);
// app.use("/api/skillrack", skillrackRoutes);
app.use("/api/extracurricular", extracurricularRoutes);
app.use("/api/publications", publicationRoutes);
app.use("/api/noncgpa-category", nonCGPACategoryRoutes);
app.use("/api/competency-coding", CompetencyCoding);
app.use("/api/noncgpa", Noncgpa);
app.use('/api/industry', staffIndustryRoutes);
app.use('/api/events', staffEventsRoutes);
app.use('/api/events-organized', staffEventsOrganizedRoutes);

app.use('/api/student/certificates', certificateRoutes);
app.use('/api/student/marksheets', marksheetRoutes);

// Admin Panel Routes
app.use('/api', adminPanelRoutes);
app.use('/api', studentPanelRoutes);
app.use("/api/projects", projectRoutes);
app.use('/api', locationRoutes);
app.use('/api', activityRoutes);
app.use('/api', ScholarshipRoutes);
app.use('/api/event-organized', eventRoutes);
app.use('/api/event-attended', eventAttendedRoutes);
app.use('/api', leaveRoutes);
app.use('/api/online-courses', OnlineCoursesRoutes);
app.use('/api', achievementRoutes);
app.use('/api', courseRoutes);
app.use("/api", biodataRoutes);
app.use('/api/mou', mouRoutes);
// Remove duplicate static serving

app.use("/api/student-certificate", certificateRoutes);
app.use("/api/resume", resumeGeneratorRoutes);
app.use('/api/resume-staff', resumeStaffRoutes);

app.use('/api/admin', adminRoleRoutes);
app.use('/api', placementMainRoutes);


// ============================================
// Activity Module Routes
// ============================================
app.use('/api/activity', activityModuleRoutes);
app.use('/api/admin/activity', activityApprovalRoutes);
app.use('/api/staff/events-attended', staffEventAttendedRoutes);
// TLP Management routes
app.use('/api/staff/tlp', tlpRoutes);
app.use('/api/admin/tlp', tlpApprovalRoutes);
app.use('/api/public/tlp', tlpPublicRoutes);
app.use('/api/public/tlp', tlpCommentRoutes);
app.use('/api/admin/tlp/comments', tlpCommentAdminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Error Handling middlewares
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large' });
    }
    return res.status(400).json({ message: error.message });
  }

  console.error('Unhandled error:', error);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
  });
});

// 404 Handler
app.use((req, res) => {
  console.log(`⚠️ 404 - Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Route not found' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME || 'record2'}`);
});

export default app;