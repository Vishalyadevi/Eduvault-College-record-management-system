import { pool } from './db/db.js';

async function run() {
  try {
    const q = `
        SELECT 
          u.userId,
          u.userName       AS username,
          u.userMail       AS email,
          u.userNumber,
          u.profileImage,
          CONCAT(
            COALESCE(sd.salutation, ''), ' ',
            COALESCE(sd.firstName, ''), ' ',
            COALESCE(sd.middleName, ''), ' ',
            COALESCE(sd.lastName, '')
          ) AS full_name,
          sd.mobileNumber AS phone,
          CONCAT_WS(' ', sd.currentAddressLine1, sd.currentAddressLine2, sd.currentCity, sd.currentState, sd.currentPincode) AS address,
          -- designation will just be sd.designationId or linked.
          sd.staffNumber,
          sd.gender,
          sd.bloodGroup,
          sd.DOB           AS dob,
          sd.DOJ           AS date_of_joining,
          sd.panNumber,
          sd.aadhaarNumber AS aadharNumber,
          sd.emergencyContactNumber AS emergencyContact,
          sd.annaUniversityFacultyId,
          sd.aicteFacultyId,
          sd.orcid,
          sd.researcherId,
          sd.googleScholarId,
          sd.scopusProfile,
          sd.vidwanProfile,
          sd.supervisorId,
          sd.hIndex,
          sd.citationIndex,
          d.departmentName AS department
        FROM users u
        LEFT JOIN staff_details sd ON u.userNumber = sd.staffNumber
        LEFT JOIN departments d ON u.departmentId = d.departmentId
        LIMIT 1
    `;
    const [rows] = await pool.query(q);
    console.log("SUCCESS:", rows);
  } catch (err) {
    console.error("ERROR:");
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
