import { pool } from './db/db.js';

async function run() {
  try {
    const userId = 1; // Assuming 1 exists
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
          'Faculty' AS designation,
          d.departmentName AS department,
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
          sd.researcherId AS researcher_id,
          sd.googleScholarId AS google_scholar_id,
          sd.scopusProfile AS scopus_profile,
          sd.vidwanProfile AS vidwan_profile,
          sd.supervisorId AS supervisor_id,
          sd.hIndex AS h_index,
          sd.citationIndex AS citation_index
        FROM users u
        LEFT JOIN staff_details sd ON u.userNumber = sd.staffNumber
        LEFT JOIN departments d ON u.departmentId = d.departmentId
        WHERE u.userId = ?
    `;
    const [rows] = await pool.query(q, [userId]);
    console.log("Found rows:", rows.length);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
