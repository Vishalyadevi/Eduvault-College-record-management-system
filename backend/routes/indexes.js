import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import multer from "multer";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { pool as db } from '../db/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only JPEG, PNG, and PDF files are allowed."), false);
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASS || "your-app-password",
  },
});

// Test database connection
async function testConnection() {
  try {
    const connection = await db.promise().getConnection();
    console.log('Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

// Initialize database tables
async function initializeDatabase() {
  try {
    const connection = await db.promise().getConnection();
    console.log('Initializing database tables...');

    // Create users1 table for login
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users1 (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userName VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'student', 'staff') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create companies table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        companyName VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        ceo VARCHAR(255),
        location VARCHAR(255),
        package DECIMAL(10,2),
        objective TEXT,
        skillSets JSON,
        localBranches JSON,
        roles JSON,
        logo VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create upcomingdrives_placement table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS upcomingdrives_placement (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post VARCHAR(255),
        company_name VARCHAR(255) NOT NULL,
        eligibility TEXT,
        date DATE NOT NULL,
        time TIME NOT NULL,
        venue VARCHAR(255),
        roles VARCHAR(255) DEFAULT 'Not specified',
        salary VARCHAR(255) DEFAULT 'Not specified',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create companydetails table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS companydetails (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        description TEXT,
        ceo VARCHAR(255),
        location VARCHAR(255),
        salary_package DECIMAL(10,2),
        objective TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create placed_student table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS placed_student (
        id INT AUTO_INCREMENT PRIMARY KEY,
        registerNumber VARCHAR(20) NOT NULL,
        name VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL,
        package DECIMAL(10,2) NOT NULL,
        year INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_year (year),
        INDEX idx_company_name (company_name),
        INDEX idx_regno (registerNumber)
      )
    `);

    // Create student_details_placement table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS student_details_placement (
        id INT AUTO_INCREMENT PRIMARY KEY,
        registerNumber VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        batch VARCHAR(10),
        hsc_percentage DECIMAL(5,2),
        sslc_percentage DECIMAL(5,2),
        sem1_cgpa DECIMAL(4,2),
        sem2_cgpa DECIMAL(4,2),
        sem3_cgpa DECIMAL(4,2),
        sem4_cgpa DECIMAL(4,2),
        sem5_cgpa DECIMAL(4,2),
        sem6_cgpa DECIMAL(4,2),
        sem7_cgpa DECIMAL(4,2),
        sem8_cgpa DECIMAL(4,2),
        history_of_arrear INT DEFAULT 0,
        standing_arrear INT DEFAULT 0,
        address TEXT,
        student_mobile VARCHAR(15),
        secondary_mobile VARCHAR(15),
        college_email VARCHAR(255),
        personal_email VARCHAR(255),
        aadhar_number VARCHAR(12),
        pancard_number VARCHAR(10),
        passport VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_regno (registerNumber),
        INDEX idx_batch (batch)
      )
    `);

    // Create registered_student_placement table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS registered_student_placement (
        id INT NOT NULL,
        registerNumber VARCHAR(20) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        register BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id, registerNumber),
        INDEX idx_regno (registerNumber),
        INDEX idx_company_name (company_name)
      )
    `);

    // Create hackathons table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS hackathons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content TEXT NOT NULL,
        link VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create notifications table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default users if they don't exist
    const [userRows] = await connection.query('SELECT * FROM users1 WHERE userName = ?', ['admin']);
    if (userRows.length === 0) {
      await connection.query(`
        INSERT INTO users1 (userName, password, role) VALUES 
        ('admin', 'admin123', 'admin'),
        ('student1', 'student123', 'student'),
        ('staff1', 'staff123', 'staff')
      `);
      console.log('Default users created');
    }

    connection.release();
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    return false;
  }
}

// Initialize database on startup - Don't run immediately on import
// This will be called when the route is actually used
let dbInitialized = false;

async function initializeDbOnFirstUse() {
  if (dbInitialized) return;

  const connected = await testConnection();
  if (connected) {
    await initializeDatabase();
    dbInitialized = true;
  } else {
    console.warn('⚠️ Database connection not available. Some features may not work.');
  }
}

// Export the initialization function to be called before critical routes
export { initializeDbOnFirstUse };

// ============================================================================
// API ROUTES
// ============================================================================

// LOGIN
app.post("/api/placement/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const query = "SELECT * FROM users1 WHERE userName = ? AND password = ?";
  db.query(query, [username, password], (err, result) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.length > 0) {
      const userRole = result[0].role;
      return res.json({ message: "Login successful", role: userRole });
    } else {
      return res.status(401).json({ message: "Invalid username or password" });
    }
  });
});

// UPCOMING DRIVES
app.post("/api/upcoming-drives", upload.single('post'), (req, res) => {
  const { company_name, eligibility, date, time, venue, roles, salary } = req.body;

  if (!company_name || !eligibility || !date || !time || !venue) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  const postFilePath = req.file ? req.file.filename : null;
  const salaryValue = salary ? salary.toString().trim() : "Not specified";
  const rolesValue = roles && roles.trim() !== "" ? roles : "Not specified";

  const query = `
    INSERT INTO upcomingdrives_placement (post, company_name, eligibility, date, time, venue, roles, salary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [postFilePath, company_name, eligibility, date, time, venue, rolesValue, salaryValue], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    // Add notification
    const notificationMsg = `📢 New Drive Alert! ${company_name} is hiring for ${rolesValue} on ${date} at ${time} in ${venue}. Package: ${salaryValue}`;
    const notifQuery = `INSERT INTO notifications (message) VALUES (?)`;

    db.query(notifQuery, [notificationMsg], (notifErr) => {
      if (notifErr) {
        console.error("Notification insert error:", notifErr);
        return res.status(500).json({ message: "Drive added, but notification failed." });
      }
      res.status(201).json({ message: "Upcoming drive added successfully!" });
    });
  });
});

app.get("/api/upcoming-drives", (req, res) => {
  const query = "SELECT * FROM upcomingdrives_placement ORDER BY date ASC, time ASC";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching upcoming drives:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.status(200).json(results);
  });
});

app.delete('/api/upcoming-drives/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.promise().query('DELETE FROM upcomingdrives_placement WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    res.status(200).json({ message: 'Drive deleted successfully' });
  } catch (error) {
    console.error('Error deleting drive:', error);
    res.status(500).json({ message: 'Error deleting drive' });
  }
});

// COMPANIES
app.get("/companies", (req, res) => {
  db.query("SELECT * FROM companies ORDER BY companyName", (err, results) => {
    if (err) {
      console.error("Error fetching companies:", err);
      return res.status(500).json({ message: "Error fetching companies." });
    }
    res.status(200).json({ companies: results });
  });
});

app.post("/add-company", upload.single("logo"), async (req, res) => {
  try {
    const { companyName, description, ceo, location, objective } = req.body;
    const salaryPackage = req.body.package;
    let { skillSets, localBranches, roles } = req.body;

    // Validate required fields
    if (!companyName || !description || !ceo || !location || !salaryPackage || !objective) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    // Parse JSON fields
    try {
      skillSets = skillSets ? JSON.parse(skillSets) : [];
      localBranches = localBranches ? JSON.parse(localBranches) : [];
      roles = roles ? JSON.parse(roles) : [];
    } catch (error) {
      console.error("JSON Parsing Error:", error);
      return res.status(400).json({ message: "Invalid JSON format in skillSets, localBranches, or roles." });
    }

    if (skillSets.length === 0 || localBranches.length === 0 || roles.length === 0) {
      return res.status(400).json({ message: "SkillSets, localBranches, and roles cannot be empty." });
    }

    const logo = req.file ? req.file.filename : null;

    const sql = `INSERT INTO companies
                 (companyName, description, ceo, location, package, objective, skillSets, localBranches, roles, logo)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await db.promise().query(sql, [
      companyName, description, ceo, location, salaryPackage, objective,
      JSON.stringify(skillSets), JSON.stringify(localBranches), JSON.stringify(roles), logo
    ]);

    res.status(201).json({ message: "Company added successfully", company: { companyName, logo } });
  } catch (error) {
    console.error("Server Error:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: "Company already exists." });
    }
    res.status(500).json({ message: "Internal Server Error.", error: error.message });
  }
});

app.put('/company/:companyName', (req, res) => {
  const companyName = req.params.companyName;
  const {
    description, objective, ceo, location, skillSets, localBranches, roles, package: companyPackage
  } = req.body;

  const query = `
    UPDATE companies
    SET description = ?, objective = ?, ceo = ?, location = ?, 
        skillSets = ?, localBranches = ?, roles = ?, package = ?
    WHERE companyName = ?
  `;

  const values = [
    description, objective, ceo, location,
    JSON.stringify(skillSets), JSON.stringify(localBranches), JSON.stringify(roles),
    companyPackage, companyName
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error updating company:", err);
      return res.status(500).json({ message: "Update failed" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json({ message: "Company updated successfully" });
  });
});

app.delete("/delete-company/:companyId", (req, res) => {
  const companyId = req.params.companyId;
  const query = "DELETE FROM companies WHERE id = ?";

  db.query(query, [companyId], (err, result) => {
    if (err) {
      console.error("Error deleting company:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json({ message: "Company deleted successfully" });
  });
});

app.get("/api/recruiterscount", (req, res) => {
  const query = "SELECT COUNT(*) AS total FROM companies";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching recruiter count:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json({ total: results[0].total });
  });
});

// PLACED STUDENTS
app.post("/api/placed-students", async (req, res) => {
  try {
    const { registerNumber, name, company_name, role, salarypackage, year } = req.body;

    if (!registerNumber || !name || !company_name || !role || !salarypackage || !year) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const query = `INSERT INTO placed_student (registerNumber, name, company_name, role, package, year) VALUES (?, ?, ?, ?, ?, ?)`;
    await db.promise().query(query, [registerNumber, name, company_name, role, salarypackage, year]);

    res.status(201).json({ message: "Placement details added successfully!" });
  } catch (error) {
    console.error("Database error:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: "Student placement already exists" });
    }
    res.status(500).json({ message: "Database error", error: error.message });
  }
});

app.get("/placed-student", (req, res) => {
  const { companyName } = req.query;

  if (!companyName) {
    return res.status(400).json({ error: "Company name is required" });
  }

  db.query(
    "SELECT year, COUNT(*) AS student_count FROM placed_student WHERE company_name = ? GROUP BY year ORDER BY year",
    [companyName],
    (err, result) => {
      if (err) {
        console.error("Error fetching placement data:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json(result);
    }
  );
});

app.get("/stats", (req, res) => {
  const query = `
    SELECT 
      COUNT(*) AS total_students, 
      AVG(package) AS avg_salary, 
      MAX(package) AS highest_salary 
    FROM placed_student
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Error fetching stats:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(result[0]);
  });
});

app.get("/placed-student-companies", (req, res) => {
  db.query("SELECT DISTINCT company_name FROM placed_student ORDER BY company_name", (err, result) => {
    if (err) {
      console.error("Error fetching companies from placed_student:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});

app.get("/student-details", (req, res) => {
  const { companyName, year } = req.query;

  if (!companyName || !year) {
    return res.status(400).json({ error: "Company name and year are required" });
  }

  db.query(
    "SELECT name, registerNumber, role, package FROM placed_student WHERE company_name = ? AND year = ? ORDER BY name",
    [companyName, year],
    (err, result) => {
      if (err) {
        console.error("Error fetching student details:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json(result);
    }
  );
});

app.get("/placed-students", (req, res) => {
  const { company } = req.query;
  let sql = "SELECT name, registerNumber, company_name, role, package, year FROM placed_student";
  const params = [];

  if (company) {
    sql += " WHERE company_name = ?";
    params.push(company);
  }

  sql += " ORDER BY year DESC, name ASC";

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Error fetching students:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});

app.post("/api/import-placed-students", async (req, res) => {
  try {
    const students = req.body.students;

    if (!students || students.length === 0) {
      return res.status(400).json({ error: "No students data provided" });
    }

    const query = "INSERT INTO placed_student (registerNumber, name, company_name, role, package, year) VALUES (?, ?, ?, ?, ?, ?)";
    let successCount = 0;
    let errorCount = 0;

    await Promise.all(
      students.map(async (student, index) => {
        try {
          const registerNumber = student["Reg No"]?.toString().trim() || null;
          const name = student["Name"]?.trim() || null;
          const company_name = student["Company Name"]?.trim() || null;
          const role = student["role"]?.trim() || null;
          let salarypackage = parseFloat(student["package"]?.toString().replace(/[^\d.]/g, ""));
          if (isNaN(salarypackage)) salarypackage = 0.00;
          const year = Number(student["year"]) || null;

          if (!registerNumber || !name || !company_name || !role || !year) {
            console.warn(`Skipping student due to missing values:`, student);
            errorCount++;
            return;
          }

          await db.promise().query(query, [registerNumber, name, company_name, role, salarypackage, year]);
          successCount++;
        } catch (error) {
          console.error(`Error inserting student ${index + 1}:`, error);
          errorCount++;
        }
      })
    );

    res.status(200).json({
      message: `Import completed! ${successCount} students imported successfully, ${errorCount} failed.`
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// STUDENT PROFILE
app.post("/api/student-profile", async (req, res) => {
  try {
    const {
      registerNumber, name, batch, hsc_percentage, sslc_percentage,
      sem1_cgpa, sem2_cgpa, sem3_cgpa, sem4_cgpa, sem5_cgpa,
      sem6_cgpa, sem7_cgpa, sem8_cgpa, history_of_arrear, standing_arrear,
      address, student_mobile, secondary_mobile, college_email, personal_email,
      aadhar_number, pancard_number, passport
    } = req.body;

    if (!registerNumber || !name || !college_email) {
      return res.status(400).json({ error: "registerNumber, name, and college email are required" });
    }

    const query = `
      INSERT INTO student_details_placement(
        registerNumber, name, batch, hsc_percentage, sslc_percentage, 
        sem1_cgpa, sem2_cgpa, sem3_cgpa, sem4_cgpa, sem5_cgpa, 
        sem6_cgpa, sem7_cgpa, sem8_cgpa, history_of_arrear, standing_arrear, 
        address, student_mobile, secondary_mobile, college_email, personal_email, 
        aadhar_number, pancard_number, passport
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      registerNumber, name, batch, hsc_percentage, sslc_percentage,
      sem1_cgpa, sem2_cgpa, sem3_cgpa, sem4_cgpa, sem5_cgpa,
      sem6_cgpa, sem7_cgpa, sem8_cgpa, history_of_arrear, standing_arrear,
      address, student_mobile, secondary_mobile, college_email, personal_email,
      aadhar_number, pancard_number, passport
    ];

    await db.promise().query(query, values);
    res.status(201).json({ message: "Profile created successfully!" });

  } catch (error) {
    console.error("Error creating student profile:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: "Student profile already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/student-profile/:registerNumber", async (req, res) => {
  const registerNumber = req.params.registerNumber;
  const {
    name, batch, hsc_percentage, sslc_percentage, sem1_cgpa, sem2_cgpa,
    sem3_cgpa, sem4_cgpa, sem5_cgpa, sem6_cgpa, sem7_cgpa, sem8_cgpa,
    history_of_arrear, standing_arrear, address, student_mobile, secondary_mobile,
    college_email, personal_email, aadhar_number, pancard_number, passport
  } = req.body;

  try {
    const query = `
      UPDATE student_details_placement
      SET name = ?, batch = ?, hsc_percentage = ?, sslc_percentage = ?,
          sem1_cgpa = ?, sem2_cgpa = ?, sem3_cgpa = ?, sem4_cgpa = ?, sem5_cgpa = ?,
          sem6_cgpa = ?, sem7_cgpa = ?, sem8_cgpa = ?, history_of_arrear = ?, standing_arrear = ?,
          address = ?, student_mobile = ?, secondary_mobile = ?, college_email = ?, personal_email = ?,
          aadhar_number = ?, pancard_number = ?, passport = ?
      WHERE registerNumber = ?
    `;

    const values = [
      name, batch, hsc_percentage, sslc_percentage, sem1_cgpa, sem2_cgpa,
      sem3_cgpa, sem4_cgpa, sem5_cgpa, sem6_cgpa, sem7_cgpa, sem8_cgpa,
      history_of_arrear, standing_arrear, address, student_mobile, secondary_mobile,
      college_email, personal_email, aadhar_number, pancard_number, passport, registerNumber
    ];

    const [result] = await db.promise().query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ message: "Profile updated successfully!" });
  } catch (error) {
    console.error("Error updating student profile:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/student-profile/:registerNumber", (req, res) => {
  const registerNumber = req.params.registerNumber;

  db.query("SELECT * FROM student_details_placement WHERE registerNumber = ?", [registerNumber], (err, results) => {
    if (err) {
      console.error("Error fetching profile:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(results[0]);
  });
});

// DRIVE REGISTRATION
app.post("/api/register-drive", (req, res) => {
  const { drive_id, registerNumber, company_name, register } = req.body;

  if (!drive_id || !registerNumber || !company_name) {
    return res.status(400).json({ error: "Drive ID, registerNumber, and company name are required" });
  }

  const query = `
    INSERT INTO registered_student_placement (id, registerNumber, company_name, register)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE register = VALUES(register)
  `;

  db.query(query, [drive_id, registerNumber, company_name, register], (err, result) => {
    if (err) {
      console.error("Error inserting into registered_student:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "Drive registration updated successfully!" });
  });
});

app.get('/api/registered-drives/:registerNumber', async (req, res) => {
  const { registerNumber } = req.params;

  try {
    if (!registerNumber) {
      return res.status(400).json({ error: "registerNumber parameter is required" });
    }

    const sql = "SELECT company_name FROM registered_student_placement WHERE registerNumber = ?";
    const [results] = await db.promise().query(sql, [registerNumber]);

    if (results.length === 0) {
      return res.status(404).json({ error: "No registered drives found for this student" });
    }

    res.json(results);
  } catch (error) {
    console.error("Error fetching registered drives:", error);
    res.status(500).json({ error: "Failed to fetch registered drives" });
  }
});

app.get("/api/admin-registered-students", (req, res) => {
  const query = `
    SELECT rs.id, rs.registerNumber, sd.name, rs.company_name, sd.college_email, sd.batch, 
           sd.hsc_percentage, sd.sslc_percentage, sd.sem1_cgpa AS cgpa, 
           sd.history_of_arrear, sd.standing_arrear
    FROM registered_student_placement rs
    JOIN student_details_placement sd ON rs.registerNumber = sd.registerNumber
    ORDER BY rs.company_name, sd.name
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching registered students:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

app.delete("/api/delete-unselected-students", (req, res) => {
  const selectedRegnos = req.body.selectedRegnos;

  if (!selectedRegnos || !Array.isArray(selectedRegnos) || selectedRegnos.length === 0) {
    return res.status(400).json({ error: "Invalid request. Selected students are required." });
  }

  const placeholders = selectedRegnos.map(() => '?').join(',');
  const sql = `DELETE FROM registered_student_placement WHERE registerNumber NOT IN (${placeholders})`;

  db.query(sql, selectedRegnos, (err, result) => {
    if (err) {
      console.error("Error deleting unselected students:", err);
      return res.status(500).json({ error: "Failed to delete unselected students." });
    }

    res.json({
      message: "Unselected students deleted successfully!",
      deletedCount: result.affectedRows
    });
  });
});

// STAFF PAGE - Student Management
app.get("/api/students", (req, res) => {
  const { startRegNo, endRegNo } = req.query;

  let query = "SELECT * FROM student_details_placement";
  let values = [];

  if (startRegNo && endRegNo) {
    query += " WHERE registerNumber BETWEEN ? AND ? ORDER BY registerNumber";
    values.push(startRegNo, endRegNo);
  } else {
    query += " ORDER BY registerNumber";
  }

  db.query(query, values, (err, results) => {
    if (err) {
      console.error("Error fetching student details:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json(results);
  });
});

// EMAIL FUNCTIONALITY
app.post("/api/send-emails", async (req, res) => {
  const { students, round } = req.body;

  if (!students || students.length === 0) {
    return res.status(400).json({ error: "No students selected" });
  }

  if (!round) {
    return res.status(400).json({ error: "Round information is required" });
  }

  try {
    const emailPromises = students.map(async (student) => {
      const mailOptions = {
        from: process.env.EMAIL_USER || "placement@college.edu",
        to: student.college_email,
        subject: `Shortlisted for Next Round (${round})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Congratulations ${student.name}!</h2>
            <p>You have been shortlisted for the next round: <strong>${round}</strong></p>
            <p>Please check with your placement officer for further details and next steps.</p>
            <hr style="margin: 20px 0;">
            <p style="color: #7f8c8d;">Best Regards,<br>Placement Cell</p>
          </div>
        `,
      };

      return transporter.sendMail(mailOptions);
    });

    await Promise.all(emailPromises);

    res.json({
      message: "Emails sent successfully!",
      sentCount: students.length
    });
  } catch (error) {
    console.error("Error sending emails:", error);
    res.status(500).json({ error: "Failed to send emails" });
  }
});

// HACKATHON MANAGEMENT
app.post('/api/hackathons', (req, res) => {
  const { content, link } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json({ error: "Hackathon content cannot be empty" });
  }

  const sql = "INSERT INTO hackathons (content, link) VALUES (?, ?)";
  db.query(sql, [content.trim(), link || null], (err, result) => {
    if (err) {
      console.error("Error adding hackathon:", err);
      return res.status(500).json({ error: "Failed to add hackathon" });
    }
    res.status(201).json({
      message: "Hackathon added successfully!",
      id: result.insertId
    });
  });
});

app.get('/api/hackathons', (req, res) => {
  const sql = "SELECT * FROM hackathons ORDER BY created_at DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching hackathons:", err);
      return res.status(500).json({ error: "Failed to fetch hackathons" });
    }
    res.json(results);
  });
});

app.delete('/api/hackathons/:id', (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: "Valid hackathon ID is required" });
  }

  const sql = "DELETE FROM hackathons WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting hackathon:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Hackathon not found" });
    }

    res.json({ message: "Hackathon deleted successfully!" });
  });
});

// NOTIFICATIONS
app.get("/api/notifications", (req, res) => {
  const query = `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5`;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Notification fetch error:", err);
      return res.status(500).json({ message: "Error fetching notifications" });
    }

    res.json(results);
  });
});

app.post("/api/notifications", (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "Notification message cannot be empty" });
  }

  const query = `INSERT INTO notifications (message) VALUES (?)`;
  db.query(query, [message.trim()], (err, result) => {
    if (err) {
      console.error("Error adding notification:", err);
      return res.status(500).json({ error: "Failed to add notification" });
    }

    res.status(201).json({
      message: "Notification added successfully!",
      id: result.insertId
    });
  });
});

// COMPANY DETAILS (Legacy endpoint)
app.post("/api/company-details", (req, res) => {
  const { companyName, description, ceo, location, objective } = req.body;
  const salaryPackage = req.body.package;

  if (!companyName || !description) {
    return res.status(400).json({ message: "Company name and description are required" });
  }

  const query = `
    INSERT INTO companydetails (company_name, description, ceo, location, salary_package, objective)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [companyName, description, ceo, location, salaryPackage, objective], (err, result) => {
    if (err) {
      console.error("Error adding company details:", err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: "Company details already exist" });
      }
      return res.status(500).json({ message: "Database error" });
    }
    res.status(201).json({ message: "Company details added successfully!" });
  });
});

// RECRUITERS DISPLAY
app.get("/api/recruiters", (req, res) => {
  const query = "SELECT companyName, logo FROM companies ORDER BY companyName";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching recruiters:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json({ recruiters: results });
  });
});

// ANALYTICS ENDPOINTS
app.get("/api/analytics/placement-trends", (req, res) => {
  const query = `
    SELECT 
      year,
      COUNT(*) as total_placements,
      AVG(package) as avg_package,
      MAX(package) as max_package,
      MIN(package) as min_package
    FROM placed_student 
    GROUP BY year 
    ORDER BY year DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching placement trends:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

app.get("/api/analytics/company-wise-placements", (req, res) => {
  const query = `
    SELECT 
      company_name,
      COUNT(*) as total_students,
      AVG(package) as avg_package,
      MAX(package) as max_package
    FROM placed_student 
    GROUP BY company_name 
    ORDER BY total_students DESC
    LIMIT 10
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching company-wise placements:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ERROR HANDLING middlewares
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large' });
    }
  }

  console.error('Unhandled error:', error);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  db.end(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  db.end(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});

// START SERVER
app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME || 'record'}`);
});