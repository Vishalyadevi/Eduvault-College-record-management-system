export const generateStaffResumePDF = async (data, profileImageData = null) => {
  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const { userInfo } = data;

    if (!userInfo) {
      console.error('User information not available for PDF generation');
      return;
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    let currentY = 20;

    // ===== HEADER =====
    // Centered Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("FACULTY PROFILE", pageWidth / 2, currentY, { align: "center" });
    currentY += 15;

    // Profile Picture (Top Right)
    const imageSize = 40;
    const imageX = pageWidth - margin - imageSize;
    const headerStartY = currentY;

    if (profileImageData && profileImageData.data) {
      try {
        doc.addImage(profileImageData.data, profileImageData.format, imageX, currentY, imageSize, imageSize);
        doc.setDrawColor(200, 200, 200);
        doc.rect(imageX, currentY, imageSize, imageSize);
      } catch (error) {
        console.warn('Could not add profile image:', error);
        doc.rect(imageX, currentY, imageSize, imageSize);
        doc.text("Photo", imageX + imageSize / 2, currentY + imageSize / 2, { align: "center" });
      }
    } else {
      doc.setDrawColor(200, 200, 200);
      doc.rect(imageX, currentY, imageSize, imageSize);
      doc.setFontSize(10);
      doc.text("Photo", imageX + imageSize / 2, currentY + imageSize / 2, { align: "center" });
    }

    // Name (Maroon/Red)
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(150, 0, 0); // Maroon
    doc.text((userInfo?.name || "[Your Name]").toUpperCase() + ",", margin, currentY);
    currentY += 8;

    // Basic Details (Left Side)
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    const basicDetails = [
      userInfo?.post || userInfo?.designation || "Designation",
      `Department of ${userInfo?.department || "Department Name"}`,
      "National Engineering College,",
      "Kovilpatti,",
      `Email: ${userInfo?.email || "N/A"}`
    ];

    basicDetails.forEach(line => {
      doc.text(line, margin, currentY);
      currentY += 6;
    });

    // Faculty IDs and Links (Left Side)
    doc.setFontSize(10);
    const idDetails = [
      `Anna University Faculty id: ${userInfo?.staffId || userInfo?.staffNumber || "N/A"}`,
      `AICTE faculty id: ${userInfo?.aicte_faculty_id || "N/A"}`,
      `ORCID: ${userInfo?.orcid || "N/A"}`,
      `Researcher ID: ${userInfo?.researcher_id || "N/A"}`,
      `Google Scholar ID: ${userInfo?.google_scholar_id || "N/A"}`,
      `Scopus Profile - authorId: ${userInfo?.scopus_profile || "N/A"}`,
      `Vidwan Profile: ${userInfo?.vidwan_profile || "N/A"}`
    ];

    idDetails.forEach(line => {
      if (!line.includes("N/A") || line.startsWith("Anna")) {
        doc.text(line, margin, currentY);
        currentY += 5;
      }
    });

    // Ensure currentY is below the image
    currentY = Math.max(currentY, headerStartY + imageSize + 10);

    const addSectionHeader = (title) => {
      if (currentY > pageHeight - 30) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(51, 102, 204); // Blue color for headers
      doc.text(title, margin, currentY);
      currentY += 8;
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    };

    // Helper to format any item into a comma-separated string of its values
    const formatItemValues = (item, sectionKey) => {
      const ignoreFields = [
        'id', 'Userid', 'user_id', 'created_at', 'updated_at',
        'proof', 'documentation', 'proof_link', 'photo_link',
        'certificate_link', 'certificate_pdf', 'order_copy',
        'yearly_report', 'final_report', 'permission_letter_link',
        'financial_proof_link', 'programme_report_link',
        'working_model_proof_link', 'prototype_proof_link', 'patent_proof_link',
        'UserId', 'status', 'userid'
      ];

      if (sectionKey === "Publications") {
        const authors = item.authors || item.author_names || 'N/A';
        const title = item.publication_title || item.title || 'N/A';
        const name = item.publication_name || item.journal_name || 'N/A';
        const date = item.publication_date ? new Date(item.publication_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : (item.year || 'N/A');
        const doi = item.doi || '';
        const ifactor = item.impact_factor || '';
        const vol = item.volume || '';
        const issue = item.issue || '';
        const pages = item.page_no || '';

        let text = `"${title}", ${authors}, ${name}`;
        if (vol) text += `, Vol. ${vol}`;
        if (issue) text += ` No. ${issue}`;
        if (pages) text += `, pp. ${pages}`;
        text += `, ${date}.`;
        if (doi) text += ` DOI: ${doi}`;
        if (ifactor) text += ` (IF: ${ifactor})`;
        return text;
      }

      if (sectionKey === "Education") {
        return `${item.degree || item.course || 'N/A'} in ${item.specialization || item.field_status || 'N/A'}, ${item.institution || 'N/A'}, ${item.year_of_passing || item.completion_year || 'N/A'}`;
      }

      // Generic formatting for other sections
      const values = Object.entries(item)
        .filter(([key, value]) => !ignoreFields.includes(key) && value && typeof value !== 'object' && !String(value).includes('http') && !String(value).includes('blob'))
        .map(([key, value]) => {
          if (key.toLowerCase().includes('date') && !isNaN(Date.parse(value)) && typeof value === 'string' && value.length > 5) {
            return new Date(value).toLocaleDateString();
          }
          return value;
        });

      return values.join(", ");
    };

    // Research Area
    addSectionHeader("Research Area");
    const researchArea = userInfo?.research_area && userInfo?.research_area !== "N/A"
      ? userInfo?.research_area
      : "N/A";
    const researchLines = doc.splitTextToSize(researchArea, contentWidth - 20);
    doc.text(researchLines, margin + 10, currentY);
    currentY += researchLines.length * 5 + 10;

    // Professional Experience Table
    addSectionHeader("Professional Experience");
    const tableHeaders = ["Institution / Organization", "Designation", "Period"];
    const colWidths = [contentWidth * 0.45, contentWidth * 0.3, contentWidth * 0.25];

    // Header Background
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, currentY - 4, contentWidth, 8, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.rect(margin, currentY - 4, contentWidth, 8);

    doc.setFont("helvetica", "bold");
    let tableX = margin;
    tableHeaders.forEach((header, i) => {
      doc.text(header, tableX + 2, currentY + 1);
      if (i < tableHeaders.length - 1) {
        doc.line(tableX + colWidths[i], currentY - 4, tableX + colWidths[i], currentY + 4);
      }
      tableX += colWidths[i];
    });
    currentY += 4;
    doc.setFont("helvetica", "normal");

    // Current Institution Entry
    const experienceData = [
      { inst: "National Engineering College, Kovilpatti", role: userInfo?.post || userInfo?.designation || "Associate Professor", period: "Till Date" }
    ];

    experienceData.forEach((row) => {
      const rowHeight = 10;
      doc.rect(margin, currentY, contentWidth, rowHeight);
      let rowX = margin;
      doc.text(row.inst, rowX + 2, currentY + 6);
      rowX += colWidths[0];
      doc.line(rowX, currentY, rowX, currentY + rowHeight);
      doc.text(row.role, rowX + 2, currentY + 6);
      rowX += colWidths[1];
      doc.line(rowX, currentY, rowX, currentY + rowHeight);
      doc.text(row.period, rowX + 2, currentY + 6);
      currentY += rowHeight;
    });
    currentY += 10;

    // List of all sections to include (everything without filtration)
    const sections = [
        "Education",
        "Events Attended",
        "Events Organized",
        "Publications",
        "Consultancy Projects",
        "Research Projects",
        "Industry Knowhow",
        "Certification Courses",
        "H-Index",
        "Proposals Submitted",
        "Resource Person",
        "Scholars",
        "Seed Money",
        "Recognition & Appreciation",
        "Patents & Products",
        "Project Mentors",
        "Sponsored Research",
        "Activities",
        "TLP Activities",
    ];

    sections.forEach((sectionKey) => {
      const sectionData = data[sectionKey] || [];
      if (!Array.isArray(sectionData) || sectionData.length === 0) return;

      addSectionHeader(sectionKey);

      sectionData.forEach((item, index) => {
        if (currentY > pageHeight - 30) {
          doc.addPage();
          currentY = 20;
        }

        const formattedText = formatItemValues(item, sectionKey);
        const textLines = doc.splitTextToSize(`${index + 1}. ${formattedText}`, contentWidth - 10);
        doc.text(textLines, margin + 5, currentY);
        currentY += textLines.length * 5 + 4;
      });
      currentY += 6;
    });

    // Footer
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: "right" });
    }

    doc.save(`${userInfo?.name?.replace(/\s+/g, "_") || "Faculty_Resume"}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
