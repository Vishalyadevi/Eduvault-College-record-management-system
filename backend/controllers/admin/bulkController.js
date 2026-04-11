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
        // Map common fields from frontend/AddUser format
        const userName = row.userName || row.username;
        const userMail = row.userMail || row.email;
        const userNumber = row.userNumber || row.registerNumber || row.staffId; // Flexible fallback
        const roleName = row.role;

        // Validate required fields for User
        if (!userName || !userMail || !roleName || !userNumber) {
          throw new Error(`Missing required core fields (userName, userMail, role, userNumber) in row: ${JSON.stringify(row)}`);
        }

        const roleId = roleMap[roleName];
        if (!roleId) {
          throw new Error(`Invalid role '${roleName}' in row: ${JSON.stringify(row)}`);
        }

        const email = userMail.toLowerCase().trim();

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
          username: userName,
          userName: userName, // Ensure both are set just in case models expect one
          email: email,
          userMail: email,
          password: hashedPassword,
          roleId: roleId,
          userNumber: userNumber,
          status: row.status || "Active",
          departmentId: row.departmentId || null,
          image: row.image || '/uploads/default.jpg',
          Created_by: ADMIN_USER_ID,
          Updated_by: ADMIN_USER_ID,
          created_at: new Date(),
          updated_at: new Date(),
        };

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

        if (row.role === "Student") {
          const userNumber = row.userNumber || row.registerNumber;
          const tutorNumber = row.tutorNumber || row.staffId; // Tutors userNumber
          
          // Validate required fields for StudentDetails
          if (!userNumber || !row.departmentId || !row.batch || !tutorNumber) {
            throw new Error(`Missing required student fields (departmentId, batch, tutorNumber) in row: ${JSON.stringify(row)}`);
          }

          // Fetch tutor's email using tutorNumber from the users table
          let tutorEmail = null;
          let tutorId = 0;
          if (tutorNumber) {
            const tutor = await User.findOne({
              where: { userNumber: tutorNumber },
              attributes: ["userMail", "Userid"],
              transaction: t,
            });
            if (tutor) {
              tutorEmail = tutor.userMail;
              tutorId = tutor.Userid;
            } else {
              throw new Error(`Tutor with User Number ${tutorNumber} not found for student ${row.userName || row.username}. Make sure the tutor exists before assigning.`);
            }
          }

          // Prepare StudentDetails data
          students.push({
            Userid: user.UserId || user.Userid || user.userId,
            registerNumber: userNumber,
            departmentId: row.departmentId,
            batch: row.batch,
            semester: row.semester || null,
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