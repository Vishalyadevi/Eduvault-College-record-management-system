// utils/excelTemplateGenerator.js
import XLSX from 'xlsx';

/**
 * Generates a SkillRack data Excel template
 * Can be used in Node.js backend or frontend
 */
export const generateSkillRackTemplate = () => {
  const headers = [
    'S No',
    'Register Number',
    'Total no of programs solved',
    'Level 1 - Learn C, Java, Python, SQL, Data Structures & DC / DT',
    'Level 2 - KICKSTART for ABSOLUTE Beginner (100)',
    'Level 3 - MNC Companies (TCS/CTS/WIPRO/INFOSYS) (250)',
    'Level 4- Data Structures & Algorithms (40)',
    'Level 5 - Product Companies (Higher Salary Package) (100)',
    'Level 6 - Dream Product Companies (Very High Salary Package) & Mini Project',
    'Code Tests',
    'Code Tracks',
    'Code Tutorial',
    'Daily Challenge',
    'Daily Test',
    'Aptitude Test',
    'Data Structure Programs Solved',
    'Bronze Medals',
    'Skillrack Rank',
    'MNC Companies',
    'Product Companies (High Salary Package)',
    'Dream Product Companies (Very High Salary Package)',
    'C',
    'C++',
    'Java',
    'Python',
    'SQL'
  ];

  // Sample data rows
  const sampleData = [
    [
      1,
      '12345678',
      150,
      50, 30, 40, 15, 10, 5,
      20, 15, 25, 30, 25,
      75.5,
      45, 3, 250,
      40, 25, 15,
      30, 25, 35, 40, 20
    ],
    [
      2,
      '87654321',
      200,
      70, 45, 60, 20, 15, 8,
      25, 20, 30, 40, 35,
      82.3,
      60, 5, 180,
      60, 35, 20,
      40, 35, 45, 50, 30
    ]
  ];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

  // Set column widths
  ws['!cols'] = headers.map(() => ({ wch: 15 }));
  ws['!cols'][1] = { wch: 20 }; // Register Number
  ws['!cols'][3] = { wch: 60 }; // Level 1
  ws['!cols'][4] = { wch: 50 }; // Level 2
  ws['!cols'][5] = { wch: 50 }; // Level 3
  ws['!cols'][6] = { wch: 45 }; // Level 4
  ws['!cols'][7] = { wch: 50 }; // Level 5
  ws['!cols'][8] = { wch: 70 }; // Level 6

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'SkillRack Data');

  return wb;
};

/**
 * Download template in browser
 */
export const downloadSkillRackTemplate = () => {
  const wb = generateSkillRackTemplate();
  XLSX.writeFile(wb, 'skillrack_template.xlsx');
};

/**
 * Generate template file in Node.js (for API endpoint)
 */
export const generateSkillRackTemplateFile = (filepath) => {
  const wb = generateSkillRackTemplate();
  XLSX.writeFile(wb, filepath);
  return filepath;
};

/**
 * Backend API endpoint to download template
 */
export const downloadTemplateEndpoint = async (req, res) => {
  try {
    const wb = generateSkillRackTemplate();
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=skillrack_template.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ message: 'Error generating template' });
  }
};


// ==============================================================
// Add this route to your Express app
// ==============================================================

// routes/skillRackRoutes.js (add this route)
/*
import { downloadTemplateEndpoint } from '../utils/excelTemplateGenerator.js';

router.get(
  "/download-template",
  authenticate,
  authorizeRoles("staff", "admin"),
  downloadTemplateEndpoint
);
*/