import React, { useState, useEffect } from "react";
import "../../styles/Home.css";
import ImageSlider from "./imageslider";
import { useAuth } from "../../../records/pages/auth/AuthContext";
import api from "../../../records/services/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";

const Home = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_registrations: 0,
    placed_count: 0,
    avg_package: 0,
    highest_package: 0
  });
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [studentDetails, setStudentDetails] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [yearWiseData, setYearWiseData] = useState([]);

  const images = [
    "https://nec.edu.in/wp-content/uploads/2024/05/IMG_20220915_145123-scaled-e1715150167202.jpg",
    "https://nec.edu.in/wp-content/uploads/elementor/thumbs/IMG_20220903_192620-scaled-1-qwsm3l08lnrsuhptct54qqxdtlmxlnvkbyz10ovo2u.jpg",
    "https://nec.edu.in/wp-content/uploads/elementor/thumbs/placment-22-23-copy-qio64bkkyw4f2pkj6yj4us996x3orssw1my20umf1i.webp",
    "https://nec.edu.in/wp-content/uploads/2024/01/IMG_2136-copy-scaled-1-1024x768.webp",
    "https://nec.edu.in/wp-content/uploads/elementor/thumbs/placement_2020_2021-scaled-copy-qio64bkkyw4f2pkj6yj4us996x3orssw1my20umf1i.webp",
    "https://nec.edu.in/wp-content/uploads/elementor/thumbs/placement_19_20-copy-qio64bkkyw4f2pkj6yj4us996x3orssw1my20umf1i.webp"
  ];

  // Fetch registration statistics
  useEffect(() => {
    api.get("/placement/registrations/stats")
      .then(res => {
        const data = res.data;
        if (data.success && data.data.overview) {
          setStats({
            total_registrations: data.data.overview.total_registrations || 0,
            placed_count: data.data.overview.placed_count || 0,
            avg_package: parseFloat(data.data.overview.avg_package) || 0,
            highest_package: 0 // Will be calculated from student data
          });
        }
      })
      .catch(err => console.error("Error fetching stats:", err));
  }, []);

  // Fetch all registered students (placed students)
  useEffect(() => {
    api.get("/placement/registrations")
      .then(res => {
        const data = res.data;
        if (data.success && Array.isArray(data.data)) {
          // Filter only placed students
          const placedStudents = data.data.filter(student => student.placed === true || student.placed === 1);

          setStudentDetails(placedStudents);
          setFilteredData(placedStudents);

          // Calculate highest package
          if (placedStudents.length > 0) {
            const maxPackage = Math.max(...placedStudents.map(s => parseFloat(s.placement_package) || 0));
            setStats(prev => ({ ...prev, highest_package: maxPackage }));
          }

          // Extract unique companies
          const uniqueCompanies = [...new Set(placedStudents.map(s => s.company_name))].filter(Boolean);
          setCompanies(uniqueCompanies.map(name => ({ company_name: name })));

          // Group by year (extract from batch or created_at)
          const yearCount = {};
          placedStudents.forEach(student => {
            // Try to extract year from batch field or use current year
            const year = student.batch || new Date(student.created_at).getFullYear();
            yearCount[year] = (yearCount[year] || 0) + 1;
          });

          const formattedData = Object.entries(yearCount).map(([year, count]) => ({
            year: year.toString(),
            count
          }));

          formattedData.sort((a, b) => a.year.localeCompare(b.year));
          setYearWiseData(formattedData);
        }
      })
      .catch(err => console.error("Error fetching students:", err));
  }, []);

  const handleCompanyChange = (e) => {
    setSelectedCompany(e.target.value);
  };

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
  };

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
  };

  const handleSubmit = () => {
    let filteredResults = [...studentDetails];

    if (selectedCompany) {
      filteredResults = filteredResults.filter(student =>
        student.company_name === selectedCompany
      );
    }

    if (selectedYear) {
      filteredResults = filteredResults.filter(student =>
        student.batch === selectedYear ||
        new Date(student.created_at).getFullYear().toString() === selectedYear
      );
    }

    if (selectedDepartment) {
      filteredResults = filteredResults.filter(student =>
        student.department && student.department.toLowerCase().includes(selectedDepartment.toLowerCase())
      );
    }

    // Sort by package (highest first)
    filteredResults.sort((a, b) =>
      (parseFloat(b.placement_package) || 0) - (parseFloat(a.placement_package) || 0)
    );

    setFilteredData(filteredResults);
  };

  const handleReset = () => {
    setSelectedCompany("");
    setSelectedYear("");
    setSelectedDepartment("");
    setFilteredData(studentDetails);
  };

  // Get unique years from student data
  const uniqueYears = [...new Set(studentDetails.map(s =>
    s.batch || new Date(s.created_at).getFullYear().toString()
  ))].sort();

  // Get unique departments
  const uniqueDepartments = [...new Set(studentDetails.map(s => s.department))].filter(Boolean).sort();

  return (
    <>

      <div className="min-h-screen bg-gray-50 bg-opacity-30">
        <h3 className="section-title">2025 Placement Statistics</h3>
        <div className="stats-container">
          <div className="stat-box">
            <h3>Students Placed</h3>
            <p>{stats.placed_count}</p>
          </div>
          <div className="stat-box">
            <h3>Total Registrations</h3>
            <p>{stats.total_registrations}</p>
          </div>
          <div className="stat-box">
            <h3>Highest Package</h3>
            <p>₹{Number(stats.highest_package).toFixed(2)} LPA</p>
          </div>
          <div className="stat-box">
            <h3>Average Package</h3>
            <p>₹{Number(stats.avg_package).toFixed(2)} LPA</p>
          </div>
        </div>

        <div className="container">
          <ImageSlider />
        </div>

        <h2 className="home-subheading">PLACEMENT CENTER</h2>
        <p className="home-text">
          Welcome to the Placement program of National Engineering College. This program consists of a
          dedicated and efficient placement team of students and staff who function round the year to
          ensure that students are placed in reputed companies across the country...
        </p>

        <h2 className="home-subheading">Functions of Placement Centre</h2>
        <ul className="home-list">
          <li>To Organize On / Off campus Interviews for the final year students.</li>
          <li>To Promote Industry-Institute Interface activities.</li>
          <li>To Arrange Career / Personal Counselling sessions.</li>
          <li>To Organize Career Guidance sessions and Personality Development programs.</li>
          <li>To Organize Functional Skill Development Programs.</li>
          <li>
            To Organize Placement Training Programs like:
            <ul>
              <li>Aptitude programs</li>
              <li>Life skills programs</li>
              <li>Motivational sessions</li>
              <li>Resume Writing</li>
              <li>Group discussions</li>
              <li>Mock Interviews</li>
            </ul>
          </li>
        </ul>

        <div className="chart-container">
          <h2 className="chart-title">Year-wise Placement Statistics</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={yearWiseData} margin={{ top: 20, right: 30, left: 20, bottom: 2 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line
                type="linear"
                dataKey="count"
                stroke="#2375f0"
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 7 }}
                name="Students Placed"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Enhanced Filter Section */}
        <div className="dropdown-container">
          <h3 style={{ width: '100%', marginBottom: '15px' }}>Filter Placed Students</h3>

          <label>Select Company: </label>
          <select value={selectedCompany} onChange={handleCompanyChange}>
            <option value="">-- All Companies --</option>
            {companies.map((comp, index) => (
              <option key={index} value={comp.company_name}>
                {comp.company_name}
              </option>
            ))}
          </select>

          <label>Select Year/Batch: </label>
          <select value={selectedYear} onChange={handleYearChange}>
            <option value="">-- All Years --</option>
            {uniqueYears.map((year, idx) => (
              <option key={idx} value={year}>{year}</option>
            ))}
          </select>

          <label>Select Department: </label>
          <select value={selectedDepartment} onChange={handleDepartmentChange}>
            <option value="">-- All Departments --</option>
            {uniqueDepartments.map((dept, idx) => (
              <option key={idx} value={dept}>{dept}</option>
            ))}
          </select>

          <button className="submit-btn" onClick={handleSubmit}>Apply Filters</button>
          <button className="submit-btn" onClick={handleReset} style={{ marginLeft: '10px', background: '#666' }}>
            Reset
          </button>
        </div>

        {/* Student Table */}
        {filteredData.length > 0 ? (
          <div className="student-details">
            <h3>
              Placed Students
              {selectedCompany && ` - ${selectedCompany}`}
              {selectedYear && ` - Batch ${selectedYear}`}
              {selectedDepartment && ` - ${selectedDepartment}`}
            </h3>
            <p style={{ marginBottom: '15px', color: '#666' }}>
              Showing {filteredData.length} of {studentDetails.length} placed students
            </p>
            <table>
              <thead>
                <tr>
                  <th>Reg No</th>
                  <th>Name</th>
                  <th>Year/Batch</th>
                  <th>Department</th>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Package (LPA)</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((student, index) => (
                  <tr key={index}>
                    <td>{student.registerNumber || 'N/A'}</td>
                    <td>{student.username || 'N/A'}</td>
                    <td>{student.batch || new Date(student.created_at).getFullYear()}</td>
                    <td>{student.department || 'N/A'}</td>
                    <td>{student.company_name || 'N/A'}</td>
                    <td>{student.placement_role || 'N/A'}</td>
                    <td>
                      <strong style={{ color: '#2375f0' }}>
                        ₹{parseFloat(student.placement_package || 0).toFixed(2)}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', background: '#f5f5f5', borderRadius: '8px', margin: '20px 0' }}>
            <p style={{ fontSize: '18px', color: '#666' }}>
              {studentDetails.length === 0
                ? 'No placement data available yet.'
                : 'No students found matching the selected filters.'}
            </p>
            {(selectedCompany || selectedYear || selectedDepartment) && (
              <button
                className="submit-btn"
                onClick={handleReset}
                style={{ marginTop: '15px' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Placement Images */}
        <div className="image-grid">
          {images.map((image, index) => (
            <div key={index} className="grid-item">
              <img src={image} alt={`Placement Batch ${index + 1}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="contact-info">
            <h3>The Principal</h3>
            <p>National Engineering College, (Autonomous)</p>
            <p>K.R.Nagar, Kovilpatti, Thoothukudi (Dt) - 628503</p>
            <p>Ph: 04632 – 222 502 | Fax: 232749</p>
            <p>Mobile: 93859 76674, 93859 76684</p>
            <p>Email: <a href="mailto:principal@nec.edu.in">principal@nec.edu.in</a></p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} National Engineering College. All Rights Reserved.</p>
        </div>
      </footer>
    </>
  );
};

export default Home;