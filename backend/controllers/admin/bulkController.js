import multer from "multer";
import xlsx from "xlsx";
import fs from "fs";
import bcrypt from "bcrypt";
import { sequelize } from "../../config/mysql.js";
import { User, StudentDetails, BulkUploadHistory, Role } from "../../models/index.js";

const upload = multer({ dest: "uploads/" });

const bulkUpload = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = req.file.path;
  const ADMIN_USER_ID = 1; // Assuming this is the admin user ID

  let t; // Declare transaction outside try-catch

  try {
    // Read the uploaded file
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Validate the file data
    if (!data.length) {
      return res.status(400).json({ error: "The file is empty or invalid." });
    }

    // Check for duplicate emails in the file itself
    const emailsInFile = data.map(row => row.email?.toLowerCase().trim());
    const duplicateEmailsInFile = emailsInFile.filter((email, index) =>
      emailsInFile.indexOf(email) !== index
    );

    if (duplicateEmailsInFile.length > 0) {
      return res.status(400).json({
        error: "Duplicate emails found in the file",
        duplicates: [...new Set(duplicateEmailsInFile)] // Get unique duplicates
      });
    }

    // Start a database transaction
    t = await sequelize.transaction();

    try {
      const users = [];
      const students = [];
      const duplicateEmails = [];
      const existingEmails = new Set();

      // First check existing emails in database
      const existingUsers = await User.findAll({
        attributes: ['email'],
        transaction: t
      });

      existingUsers.forEach(user => {
        existingEmails.add(user.email.toLowerCase());
      });

      // Fetch all roles to map name to ID
      const rolesList = await Role.findAll();
      const roleMap = {};
      rolesList.forEach(r => {
        roleMap[r.roleName] = r.roleId;
      });

      // Process each row in the CSV
      for (const row of data) {
        // Validate required fields for User
        if (!row.username || !row.email || !row.role || !row.staffId) {
          throw new Error(`Missing required fields in row: ${JSON.stringify(row)}`);
        }

        const roleName = row.role;
        const roleId = roleMap[roleName];
        if (!roleId) {
          throw new Error(`Invalid role '${roleName}' in row: ${JSON.stringify(row)}`);
        }

        const email = row.email.toLowerCase().trim();

        // Check if email already exists in database
        if (existingEmails.has(email)) {
          duplicateEmails.push(email);
          continue; // Skip this record
        }

        // Hash the password (use a default password if not provided)
        const password = row.password || "nec@123";
        const hashedPassword = await bcrypt.hash(password, 10);

        // Prepare User data
        const userData = {
          username: row.username,
          email: email,
          password: hashedPassword,
          roleId: roleId,
          status: row.status || "active",
          departmentId: row.departmentId || null,
          image: row.image || '/uploads/deafult.jpg',
          Created_by: ADMIN_USER_ID,
          Updated_by: ADMIN_USER_ID,
          created_at: new Date(),
          updated_at: new Date(),
        };

        // Add staffId only for staff members
        if (row.role === "Staff") {
          if (!row.staffId) {
            throw new Error(`Missing staffId for staff member: ${JSON.stringify(row)}`);
          }
          userData.userNumber = row.staffId;
        }

        users.push(userData);
        existingEmails.add(email); // Add to set to prevent duplicates in this batch
      }

      // If there were duplicate emails, return them
      if (duplicateEmails.length > 0) {
        return res.status(400).json({
          error: "Some emails already exist in the system",
          duplicates: duplicateEmails
        });
      }

      // Bulk insert Users
      const createdUsers = await User.bulkCreate(users, {
        ignoreDuplicates: true,
        returning: true,
        transaction: t,
      });

      // Prepare StudentDetails data for students
      for (let i = 0; i < createdUsers.length; i++) {
        const user = createdUsers[i];
        const row = data[i];

        if (user.role === "Student") {
          // Validate required fields for StudentDetails
          if (!row.registerNumber || !row.departmentId || !row.batch || !row.staffId) {
            throw new Error(`Missing required student fields in row: ${JSON.stringify(row)}`);
          }

          // Fetch tutor's email using staffId from the users table
          let tutorEmail = null;
          let tutorId = 0;
          if (row.staffId) {
            const tutor = await User.findOne({
              where: { userNumber: row.staffId },
              attributes: ["userMail", "Userid"],
              transaction: t,
            });
            if (tutor) {
              tutorEmail = tutor.userMail;
              tutorId = tutor.Userid;
            }
          }

          // Prepare StudentDetails data
          students.push({
            Userid: user.UserId || user.Userid || user.userId,
            registerNumber: row.registerNumber,
            departmentId: row.departmentId,
            batch: row.batch,
            staffId: tutorId,
            tutorEmail: tutorEmail,
            Created_by: ADMIN_USER_ID,
            Updated_by: ADMIN_USER_ID,
          });
        }
      }

      // Bulk insert StudentDetails
      if (students.length > 0) {
        await StudentDetails.bulkCreate(students, {
          ignoreDuplicates: true,
          transaction: t,
        });
      }

      // Record Bulk Upload History
      await BulkUploadHistory.create({
        Userid: ADMIN_USER_ID,
        filename: req.file.originalname,
        file_size: req.file.size / 1024,
        download_type: req.file.mimetype,
        total_records: data.length,
        records_processed: createdUsers.length,
      }, { transaction: t });

      // Commit the transaction
      await t.commit();

      // Delete the uploaded file after successful commit
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({
        message: `Users imported successfully! ${createdUsers.length} out of ${data.length} records processed.`,
        totalRecords: data.length,
        recordsProcessed: createdUsers.length,
        duplicates: duplicateEmailsInFile.length > 0 ? duplicateEmailsInFile : null
      });

    } catch (error) {
      // Rollback only if transaction exists
      if (t) await t.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({
      error: error.message || "Failed to process the file.",
      details: error.details
    });
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

export { upload, bulkUpload };