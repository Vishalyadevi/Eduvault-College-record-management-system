import axios from 'axios';

const generatePdf = async (data) => {
  try {
    // Get userId from the data or localStorage
    const userId = data.studentData?.Userid ||
      data.studentData?.studentUser?.Userid ||
      data.studentData?.id ||
      localStorage.getItem('userId') ||
      'demo-user-123'; // Fallback for demo

    if (!userId) {
      throw new Error('User ID not found. Please ensure you are logged in.');
    }

    console.log('Generating PDF for user:', userId);

    /* PRODUCTION CODE - Uncomment when backend is ready:
    const response = await axios.get(`http://localhost:4000/api/student/student-report/${userId}`, {
      responseType: 'blob',
      timeout: 30000, // 30 second timeout
      headers: {
        'Accept': 'application/pdf',
        'Authorization': `Bearer ${localStorage.getItem('token')}` // If you use authentication tokens
      },
    });

    if (response.data.size === 0) {
      throw new Error('Empty PDF received from server');
    }

    console.log('PDF generated successfully, size:', response.data.size, 'bytes');
    return response.data;
    */

    // MOCK PDF GENERATION FOR DEMO
    return await generateMockPdf(data);

  } catch (error) {
    console.error('Error generating PDF:', error);

    if (error.response) {
      switch (error.response.status) {
        case 404:
          throw new Error('Student data not found. Please check if your profile is complete.');
        case 401:
          throw new Error('Authentication required. Please log in again.');
        case 403:
          throw new Error('Access denied. You can only view your own report.');
        case 500:
          throw new Error('Server error while generating PDF. Please try again later.');
        default:
          throw new Error(`Server error (${error.response.status}): ${error.response.data?.error || 'Unknown error'}`);
      }
    } else if (error.request) {
      throw new Error('Could not connect to server. Please check your internet connection.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('PDF generation timed out. Please try again.');
    } else {
      throw new Error(error.message || 'An unexpected error occurred while generating PDF.');
    }
  }
};

// Mock PDF generation for demonstration
const generateMockPdf = async (data) => {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let yPosition = 20;
  const lineHeight = 7;
  const sectionSpacing = 15;

  const addTitle = (title) => {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(66, 102, 241); // Primary blue
    doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += sectionSpacing;
  };

  const addSectionHeader = (header) => {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81); // Dark gray
    doc.text(header, 20, yPosition);
    yPosition += 2;
    doc.setDrawColor(66, 102, 241);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += sectionSpacing;
  };

  const addField = (label, value) => {
    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(75, 85, 99);
    doc.text(label + ':', 20, yPosition);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(17, 24, 39);
    const textWidth = pageWidth - 80;
    const splitText = doc.splitTextToSize(value || 'N/A', textWidth);
    doc.text(splitText, 80, yPosition);
    yPosition += lineHeight * Math.max(1, splitText.length);
  };

  const addListItem = (index, title, details) => {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(`${index}. ${title}`, 25, yPosition);
    yPosition += lineHeight;

    details.forEach(detail => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      const textWidth = pageWidth - 60;
      const splitText = doc.splitTextToSize(detail, textWidth);
      doc.text(splitText, 30, yPosition);
      yPosition += lineHeight * Math.max(1, splitText.length);
    });
    yPosition += 5;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US');
  };

  // Generate PDF content
  addTitle('STUDENT ACTIVITY REPORT');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(data.studentData?.username || 'Student Name', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += lineHeight;
  doc.text(`${data.studentData?.department || 'Department'} | ${data.studentData?.registerNumber || 'Registration Number'}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += sectionSpacing;

  doc.setFontSize(10);
  doc.text(`Report Generated: ${new Date().toLocaleDateString('en-US')}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += sectionSpacing * 2;

  // Personal Information
  addSectionHeader('PERSONAL INFORMATION');
  addField('Full Name', data.studentData?.username);
  addField('Registration Number', data.studentData?.registerNumber);
  addField('Email', data.studentData?.email);
  addField('Department', data.studentData?.department);
  addField('Batch', data.studentData?.batch);
  addField('Gender', data.studentData?.gender);
  addField('Date of Birth', formatDate(data.studentData?.dob));
  addField('Blood Group', data.studentData?.blood_group);
  addField('Phone', data.studentData?.phone);
  addField('Father\'s Name', data.studentData?.father_name);
  addField('Mother\'s Name', data.studentData?.mother_name);
  addField('Address', data.studentData?.address);
  addField('City', data.studentData?.city);
  addField('State', data.studentData?.state);
  yPosition += sectionSpacing;

  // Online Courses
  if (data.courses && data.courses.length > 0) {
    addSectionHeader('ONLINE COURSES');
    data.courses.forEach((course, index) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }

      const parts = [
        course.provider_name ? `Provider: ${course.provider_name}` : null,
        course.type ? `Type: ${course.type}` : null,
        course.instructor_name ? `Instructor: ${course.instructor_name}` : null,
        course.status ? `Status: ${course.status}` : null,
        `Approval: ${course.tutor_approval_status ? 'Approved' : 'Pending'}`,
        `Date Added: ${formatDate(course.created_at)}`
      ].filter(Boolean);

      const line = `${index + 1}. ${course.course_name || 'Course'} (${parts.join(', ')})`;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      const textWidth = pageWidth - 40;
      const wrapped = doc.splitTextToSize(line, textWidth);
      doc.text(wrapped, 20, yPosition);
      yPosition += lineHeight * Math.max(1, wrapped.length) + 3;
    });
  }

  // Internships
  if (data.internships && data.internships.length > 0) {
    addSectionHeader('INTERNSHIPS');
    data.internships.forEach((internship, index) => {
      addListItem(index + 1, internship.provider_name, [
        `Description: ${internship.description}`,
        `Domain: ${internship.domain}`,
        `Mode: ${internship.mode}`,
        `Duration: ${formatDate(internship.start_date)} - ${formatDate(internship.end_date)}`,
        `Status: ${internship.status}`,
        `Stipend: ${internship.stipend_amount ? `₹${internship.stipend_amount}` : 'N/A'}`,
        `Approval Status: ${internship.tutor_approval_status ? 'Approved' : 'Pending'}`
      ]);
    });
  }

  // Events Attended
  if (data.attendedEvents && data.attendedEvents.length > 0) {
    addSectionHeader('EVENTS ATTENDED');
    data.attendedEvents.forEach((event, index) => {
      addListItem(index + 1, event.event_name, [
        `Description: ${event.description || 'N/A'}`,
        `Event Type: ${event.event_type || 'N/A'}`,
        `Institution: ${event.institution_name || 'N/A'}`,
        `Mode: ${event.mode}`,
        `Duration: ${formatDate(event.from_date)} - ${formatDate(event.to_date)}`,
        `Participation Status: ${event.participation_status || 'N/A'}`,
        `Achievement Details: ${event.achievement_details || 'N/A'}`,
        `Approval Status: ${event.tutor_approval_status ? 'Approved' : 'Pending'}`
      ]);
    });
  }

  // Events Organized
  if (data.organizedEvents && data.organizedEvents.length > 0) {
    addSectionHeader('EVENTS ORGANIZED');
    data.organizedEvents.forEach((event, index) => {
      addListItem(index + 1, event.event_name, [
        `Club/Organization: ${event.club_name || 'N/A'}`,
        `Role: ${event.role || 'N/A'}`,
        `Staff In-charge: ${event.staff_incharge || 'N/A'}`,
        `Duration: ${formatDate(event.start_date)} - ${formatDate(event.end_date)}`,
        `Participants: ${event.number_of_participants || 'N/A'}`,
        `Mode: ${event.mode}`,
        `Funding Agency: ${event.funding_agency || 'N/A'}`,
        `Funding Amount: ${event.funding_amount ? `₹${event.funding_amount}` : 'N/A'}`,
        `Approval Status: ${event.tutor_approval_status ? 'Approved' : 'Pending'}`
      ]);
    });
  }

  // Scholarships
  if (data.scholarships && data.scholarships.length > 0) {
    addSectionHeader('SCHOLARSHIPS');
    data.scholarships.forEach((scholarship, index) => {
      addListItem(index + 1, scholarship.name, [
        `Provider: ${scholarship.provider}`,
        `Type: ${scholarship.type}`,
        `Year: ${scholarship.year}`,
        `Status: ${scholarship.status}`,
        `Applied Date: ${formatDate(scholarship.appliedDate)}`,
        `Received Amount: ${scholarship.receivedAmount ? `₹${scholarship.receivedAmount}` : 'N/A'}`,
        `Received Date: ${formatDate(scholarship.receivedDate)}`,
        `Approval Status: ${scholarship.tutor_approval_status ? 'Approved' : 'Pending'}`
      ]);
    });
  }

  // Achievements
  if (data.achievements && data.achievements.length > 0) {
    addSectionHeader('ACHIEVEMENTS');
    data.achievements.forEach((achievement, index) => {
      addListItem(index + 1, achievement.title, [
        `Description: ${achievement.description}`,
        `Date Awarded: ${formatDate(achievement.date_awarded)}`,
        `Approval Status: ${achievement.tutor_approval_status ? 'Approved' : 'Pending'}`
      ]);
    });
  }

  // Leave Applications
  if (data.leaves && data.leaves.length > 0) {
    addSectionHeader('LEAVE APPLICATIONS');
    data.leaves.forEach((leave, index) => {
      addListItem(index + 1, 'Leave Application', [
        `Reason: ${leave.reason}`,
        `Leave Type: ${leave.leave_type}`,
        `Duration: ${formatDate(leave.start_date)} - ${formatDate(leave.end_date)}`,
        `Number of Days: ${leave.number_of_days}`,
        `Status: ${leave.leave_status}`,
        `Applied Date: ${formatDate(leave.applied_date)}`
      ]);
    });
  }

  // Summary Statistics
  doc.addPage();
  yPosition = 20;
  addSectionHeader('ACTIVITY SUMMARY');

  const stats = [
    { label: 'Total Online Courses', value: data.courses?.length || 0, approved: data.courses?.filter(c => c.tutor_approval_status).length || 0 },
    { label: 'Total Internships', value: data.internships?.length || 0, approved: data.internships?.filter(i => i.tutor_approval_status).length || 0 },
    { label: 'Events Organized', value: data.organizedEvents?.length || 0, approved: data.organizedEvents?.filter(e => e.tutor_approval_status).length || 0 },
    { label: 'Events Attended', value: data.attendedEvents?.length || 0, approved: data.attendedEvents?.filter(e => e.tutor_approval_status).length || 0 },
    { label: 'Scholarships', value: data.scholarships?.length || 0, approved: data.scholarships?.filter(s => s.tutor_approval_status).length || 0 },
    { label: 'Achievements', value: data.achievements?.length || 0, approved: data.achievements?.filter(a => a.tutor_approval_status).length || 0 },
    { label: 'Leave Applications', value: data.leaves?.length || 0, approved: data.leaves?.filter(l => l.leave_status === 'approved').length || 0 }
  ];

  stats.forEach(stat => {
    addField(stat.label, `${stat.value} (${stat.approved} approved)`);
  });

  // Footer
  yPosition = pageHeight - 30;
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('This report was generated automatically and contains all student activities as recorded in the system.', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;
  doc.text(`Generated on ${new Date().toLocaleString('en-US')} | Student Activity Management System`, pageWidth / 2, yPosition, { align: 'center' });

  // Convert to blob
  const pdfBlob = doc.output('blob');
  console.log('Mock PDF generated successfully, size:', pdfBlob.size, 'bytes');

  return pdfBlob;
};

export default generatePdf;
