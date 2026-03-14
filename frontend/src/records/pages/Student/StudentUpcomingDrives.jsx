import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UpcomingDrives.css';
import CustomAlert from "../CustomAlert";
import { useAuth } from "../auth/AuthContext";
import API from "../../../api";
import config from "../../../config";


const StudentUpcomingDrives = () => {
  const { user } = useAuth();
  const userId = user?.userId || user?.id;
  const [drives, setDrives] = useState([]);
  const [registeredDrives, setRegisteredDrives] = useState([]);
  const [alertMessage, setAlertMessage] = useState("");
  const studentRegNo = user?.registerNumber || user?.registerNumber || localStorage.getItem('username');


  useEffect(() => {
    fetchUpcomingDrives();
    fetchRegisteredDrives(); // Fetch the student's already registered drives
  }, []);

  // Fetch all upcoming drives
  const fetchUpcomingDrives = async () => {
    try {
      const response = await API.get('/student-upcoming-drives');
      setDrives(response.data);
    } catch (error) {
      console.error('Error fetching upcoming drives:', error);
    }
  };


  // Fetch the drives the student has already registered for
  const fetchRegisteredDrives = async () => {
    if (!studentRegNo) return;

    try {
      const response = await API.get(`/registered-drives/${studentRegNo}`);
      const registeredCompanies = response.data.map(item => item.company_name);
      setRegisteredDrives(registeredCompanies);
    } catch (error) {
      console.error('Error fetching registered drives:', error);
    }
  };


  // Handle student registration
  const handleRegister = async (driveId, companyName) => {
    if (!studentRegNo) {
      setAlertMessage("Student registration number not found. Please log in."); // ✅ Set alert message
      return;
    }

    // Check if the student is already registered for this company
    if (registeredDrives.includes(companyName)) {
      setAlertMessage(`You have already registered for ${companyName}`); // ✅ Set alert message
      return;
    }

    try {
      await API.post("/register-drive", {
        drive_id: driveId,
        registerNumber: studentRegNo,
        company_name: companyName,
        register: "Yes",
      });


      setAlertMessage(`Successfully registered for ${companyName}`); // ✅ Set alert message
      fetchRegisteredDrives(); // Refresh the registered list
    } catch (error) {
      console.error("Error registering for drive:", error);
      setAlertMessage("Error registering for drive. Please try again."); // ✅ Set alert message
    }
  };

  return (
    <>
      {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage("")} />} {/* ✅ Show alert */}

      <div className="student-upcomingdrive">
        <h1 className="title">Upcoming Drives</h1>
        <div className="drives-container">
          {drives.map((drive) => (
            <div key={drive.id} className="drive-card">
              {drive.post && (
                <img
                  src={`${config.backendUrl}/uploads/${drive.post}`}
                  alt="Company Post"
                  className="company-logo"
                />
              )}

              <p><strong>Company:</strong> {drive.company_name}</p>
              <p><strong>Eligibility:</strong> {drive.eligibility}</p>
              <p><strong>Date:</strong> {new Date(drive.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {drive.time}</p>
              <p><strong>Venue:</strong> {drive.venue}</p>
              <p><strong>Role:</strong> {drive.roles}</p>
              <p><strong>Package:</strong> {drive.salary}</p>

              <button
                className="register-btn"
                onClick={() => handleRegister(drive.id, drive.company_name)}
                disabled={registeredDrives.includes(drive.company_name)}
              >
                {registeredDrives.includes(drive.company_name) ? "Applied" : "Apply"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default StudentUpcomingDrives;


// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import '../../styles/studentUpcomingDrive.css';
// import Navbar from './navbar';

// const StudentUpcomingDrives = () => {
//   const [drives, setDrives] = useState([]);
//   const [registeredDrives, setRegisteredDrives] = useState([]); // Stores registered company names
//   const studentRegNo = localStorage.getItem('username'); // Get registerNumber from localStorage

//   useEffect(() => {
//     fetchUpcomingDrives();
//     fetchRegisteredDrives(); // Fetch the student's already registered drives
//   }, []);

//   // Fetch all upcoming drives
//   const fetchUpcomingDrives = async () => {
//     try {
//       const response = await axios.get('http://localhost:5000/api/student-upcoming-drives');
//       setDrives(response.data);
//     } catch (error) {
//       console.error('Error fetching upcoming drives:', error);
//     }
//   };

//   // Fetch the drives the student has already registered for
//   const fetchRegisteredDrives = async () => {
//     if (!studentRegNo) return;

//     try {
//       const response = await axios.get(`http://localhost:4000/api/registered-drives/${studentRegNo}`);
//       const registeredCompanies = response.data.map(item => item.company_name);
//       setRegisteredDrives(registeredCompanies);
//     } catch (error) {
//       console.error('Error fetching registered drives:', error);
//     }
//   };

//   // Handle student registration
//   const handleRegister = async (driveId, companyName) => {
//     if (!studentRegNo) {
//       alert("Student registration number not found. Please log in.");
//       return;
//     }

//     // Check if the student is already registered for this company
//     if (registeredDrives.includes(companyName)) {
//       alert(`You have already registered for ${companyName}`);
//       return;
//     }

//     try {
//       await axios.post("http://localhost:5000/api/register-drive", {
//         drive_id: driveId,
//         registerNumber: studentRegNo,
//         company_name: companyName,
//         register: "Yes",
//       });

//       alert(`Successfully registered for ${companyName}`);
//       fetchRegisteredDrives(); // Refresh the registered list
//     } catch (error) {
//       console.error("Error registering for drive:", error);
//     }
//   };

//   return (
//     <>
//       <Navbar/>
//       <div className="student-upcomingdrive">
//         <h1 className="title">Upcoming Drives</h1>
//         <div className="drives-container">
//           {drives.map((drive) => (
//             <div key={drive.id} className="drive-card">
//               {drive.post && (
//                 <img
//                   src={`http://localhost:5000/uploads/${drive.post}`}
//                   alt="Company Post"
//                   className="company-logo"
//                 />
//               )}
//               <p><strong>Company:</strong> {drive.company_name}</p>
//               <p><strong>Eligibility:</strong> {drive.eligibility}</p>
//               <p><strong>Date:</strong> {new Date(drive.date).toLocaleDateString()}</p>
//               <p><strong>Time:</strong> {drive.time}</p>
//               <p><strong>Venue:</strong> {drive.venue}</p>
//               <p><strong>Role:</strong> {drive.roles}</p>
//               <p><strong>Salary:</strong> {drive.salary}</p>

//               <button
//                 className="register-btn"
//                 onClick={() => handleRegister(drive.id, drive.company_name)}
//                 disabled={registeredDrives.includes(drive.company_name)}
//               >
//                 {registeredDrives.includes(drive.company_name) ? "Registered" : "Register"}
//               </button>
//             </div>
//           ))}
//         </div>
//       </div>
//     </>
//   );
// };

// export default StudentUpcomingDrives;