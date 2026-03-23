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
          -- prefer personal_information but fall back to staff_details name components
          COALESCE(pi.full_name,
            CONCAT(
              COALESCE(sd.salutation, ''), ' ',
              COALESCE(sd.firstName, ''), ' ',
              COALESCE(sd.middleName, ''), ' ',
              COALESCE(sd.lastName, '')
            )
          ) AS full_name,
          COALESCE(pi.mobile_number, sd.mobileNumber) AS phone,
          COALESCE(pi.communication_address,
                   CONCAT_WS(' ', sd.currentAddressLine1, sd.currentAddressLine2, sd.currentCity, sd.currentState, sd.currentPincode)
          ) AS address,
          -- designation may exist in personal_information or come from staff_details designationId lookup later
          pi.post          AS designation,
          pi.anna_university_faculty_id,
          pi.aicte_faculty_id,
          pi.orcid,
          pi.researcher_id,
          pi.google_scholar_id,
          pi.scopus_profile,
          pi.vidwan_profile,
          pi.supervisor_id,
          pi.h_index       AS pi_h_index,
          pi.citation_index AS pi_citation_index,
          d.departmentName AS department,
          sd.staffNumber,
          sd.gender,
          sd.bloodGroup,
          sd.DOB           AS dob,
          sd.DOJ           AS date_of_joining,
          sd.panNumber,
          sd.aadhaarNumber AS aadharNumber,
          sd.emergencyContactNumber AS emergencyContact,
          sd.annaUniversityFacultyId AS sd_anna_univ_id,
          sd.aicteFacultyId AS sd_aicte_id,
          sd.orcid         AS sd_orcid
        FROM users u
        LEFT JOIN personal_information pi ON u.userId = pi.Userid
        LEFT JOIN staff_details sd ON u.userNumber = sd.staffNumber
        LEFT JOIN departments d ON u.departmentId = d.departmentId
        LIMIT 1
    `;
    const [rows] = await pool.query(q);
    console.log("SUCCESS:", rows.length);
  } catch (err) {
    console.error("ERROR:");
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
