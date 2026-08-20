// controllers/student/studentPublicationController.js
import { User, StudentDetails, StudentPublication } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";

// ========================
// MAIN PUBLICATION ENDPOINTS
// ========================

// Add new publication
export const addPublication = async (req, res) => {
  try {
    const {
      Userid,
      publication_type,
      publication_name,
      title,
      authors,
      index_type,
      doi,
      publisher,
      publication_date,
      publication_status,
    } = req.body;

    // Validate required fields
    if (!Userid || !publication_type || !title) {
      return res.status(400).json({ message: "Publication type, title, and Userid are required" });
    }

    // Validate publication type
    const validTypes = [
      'Journal', 'Conference', 'Book', 'Book Chapter',
      'Workshop', 'Thesis', 'Preprint', 'White Paper',
      'Patent', 'Other',
    ];
    if (!validTypes.includes(publication_type)) {
      return res.status(400).json({ message: "Invalid publication type" });
    }

    // Validate index type
    const validIndexTypes = [
      'Scopus', 'Web of Science', 'PubMed', 'IEEE Xplore',
      'ACM Digital Library', 'SSRN', 'Not Indexed', 'Other',
    ];
    if (index_type && !validIndexTypes.includes(index_type)) {
      return res.status(400).json({ message: "Invalid index type" });
    }

    // Validate status
    const validStatuses = ['Draft', 'Under Review', 'Accepted', 'Published', 'Rejected', 'Withdrawn'];
    if (publication_status && !validStatuses.includes(publication_status)) {
      return res.status(400).json({ message: "Invalid publication status" });
    }

    // Fetch user
    const user = await User.findByPk(Userid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch student details
    const student = await StudentDetails.findOne({ where: { Userid } });

    // Parse authors if provided as string
    let parsedAuthors = authors;
    if (typeof authors === 'string') {
      try {
        parsedAuthors = JSON.parse(authors);
      } catch (e) {
        return res.status(400).json({ message: "Authors must be a valid JSON array" });
      }
    }

    // Create publication
    const publication = await StudentPublication.create({
      Userid,
      publication_type,
      publication_name,
      title,
      authors: parsedAuthors || [],
      index_type: index_type || 'Not Indexed',
      doi,
      publisher,
      publication_date,
      publication_status: publication_status || 'Draft',
      status_date: new Date(),
      pending: true,
      tutor_verification_status: false,
      Created_by: Userid,
      Updated_by: Userid,
    });

    // Send email to tutor
    if (student && student.tutorEmail) {
      const authorsStr = Array.isArray(parsedAuthors) ? parsedAuthors.join(', ') : 'N/A';
      const emailText = `Dear Tutor,\n\nA student has submitted a new publication for verification.\n\nStudent Details:\nRegno: ${student.registerNumber}\nName: ${user.username || "N/A"}\n\nPublication Details:\nType: ${publication_type}\nTitle: ${title}\nAuthors: ${authorsStr}\nStatus: ${publication_status || 'Draft'}\nDOI: ${doi || "N/A"}\nPublisher: ${publisher || "N/A"}\nIndex Type: ${index_type || "Not Indexed"}\nPublication Date: ${publication_date || "N/A"}\n\nThe publication is pending your verification.\n\nBest Regards,\nPublication Management System`;

      await sendEmail({
        from: user.email,
        to: student.tutorEmail,
        subject: "New Publication Submitted - Pending Verification",
        text: emailText,
      });
    }

    res.status(201).json({
      message: "Publication submitted successfully",
      publication,
    });
  } catch (error) {
    console.error("❌ Error adding publication:", error);
    res.status(500).json({ message: "Error adding publication", error: error.message });
  }
};

// Update publication
export const updatePublication = async (req, res) => {
  const { id } = req.params;
  const {
    publication_type,
    publication_name,
    title,
    authors,
    index_type,
    doi,
    publisher,
    publication_date,
    publication_status,
    Userid,
  } = req.body;

  try {
    const publication = await StudentPublication.findByPk(id);
    if (!publication) {
      return res.status(404).json({ message: "Publication not found" });
    }

    // Check authorization
    if (publication.Userid !== parseInt(Userid)) {
      return res.status(403).json({ message: "Unauthorized to update this publication" });
    }

    // Validate enums if provided
    const validTypes = [
      'Journal', 'Conference', 'Book', 'Book Chapter',
      'Workshop', 'Thesis', 'Preprint', 'White Paper',
      'Patent', 'Other',
    ];
    const validIndexTypes = [
      'Scopus', 'Web of Science', 'PubMed', 'IEEE Xplore',
      'ACM Digital Library', 'SSRN', 'Not Indexed', 'Other',
    ];
    const validStatuses = ['Draft', 'Under Review', 'Accepted', 'Published', 'Rejected', 'Withdrawn'];

    if (publication_type && !validTypes.includes(publication_type)) {
      return res.status(400).json({ message: "Invalid publication type" });
    }
    if (index_type && !validIndexTypes.includes(index_type)) {
      return res.status(400).json({ message: "Invalid index type" });
    }
    if (publication_status && !validStatuses.includes(publication_status)) {
      return res.status(400).json({ message: "Invalid publication status" });
    }

    const user = await User.findByPk(Userid);
    const student = await StudentDetails.findOne({ where: { Userid } });

    // Parse authors if provided as string
    let parsedAuthors = authors;
    if (authors && typeof authors === 'string') {
      try {
        parsedAuthors = JSON.parse(authors);
      } catch (e) {
        return res.status(400).json({ message: "Authors must be a valid JSON array" });
      }
    }

    // Update fields
    publication.publication_type = publication_type ?? publication.publication_type;
    publication.publication_name = publication_name ?? publication.publication_name;
    publication.title = title ?? publication.title;
    publication.authors = parsedAuthors ?? publication.authors;
    publication.index_type = index_type ?? publication.index_type;
    publication.doi = doi ?? publication.doi;
    publication.publisher = publisher ?? publication.publisher;
    publication.publication_date = publication_date ?? publication.publication_date;
    publication.publication_status = publication_status ?? publication.publication_status;
    publication.status_date = publication_status ? new Date() : publication.status_date;
    publication.Updated_by = Userid;
    publication.pending = true;
    publication.tutor_verification_status = false;
    publication.Verified_by = null;
    publication.verified_at = null;

    await publication.save();

    // Send update email to tutor
    if (student && student.tutorEmail) {
      const emailText = `Dear Tutor,\n\nA student has updated their publication details.\n\nStudent: ${user?.username || "N/A"}\nRegno: ${student.registerNumber}\n\nPublication:\nTitle: ${publication.title}\nType: ${publication.publication_type}\nStatus: ${publication.publication_status}\n\nThe publication is now pending re-verification.\n\nBest Regards,\nPublication Management System`;

      await sendEmail({
        from: user?.email,
        to: student.tutorEmail,
        subject: "Publication Updated - Requires Re-verification",
        text: emailText,
      });
    }

    res.status(200).json({
      message: "Publication updated successfully",
      publication,
    });
  } catch (error) {
    console.error("❌ Error updating publication:", error);
    res.status(500).json({ message: "Error updating publication", error: error.message });
  }
};

// Get student's publications
export const getStudentPublications = async (req, res) => {
  try {
    const userId = req.user?.Userid || req.query.UserId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const publications = await StudentPublication.findAll({
      where: { Userid: userId },
      order: [["publication_date", "DESC"]],
    });

    res.status(200).json({ success: true, count: publications.length, publications });
  } catch (error) {
    console.error("Error fetching student publications:", error);
    res.status(500).json({ message: "Error fetching publications" });
  }
};

// Get pending publications
export const getPendingPublications = async (req, res) => {
  try {
    const publications = await StudentPublication.findAll({
      where: { pending: true },
      include: [
        {
          model: User,
          as: "organizer",
          attributes: ["userId", "userName", "userMail"],
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              attributes: ["registerNumber", "staffId"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formattedPublications = publications.map((pub) => {
      const { organizer, ...rest } = pub.get({ plain: true });
      return {
        ...rest,
        username: organizer?.userName || "N/A",
        email: organizer?.userMail || "N/A",
        registerNumber: organizer?.studentDetails?.registerNumber || "N/A",
        staffId: organizer?.studentDetails?.staffId || "N/A",
      };
    });

    res.status(200).json({ success: true, count: formattedPublications.length, publications: formattedPublications });
  } catch (error) {
    console.error("Error fetching pending publications:", error);
    res.status(500).json({ message: "Error fetching pending publications" });
  }
};

// Get verified publications
export const getVerifiedPublications = async (req, res) => {
  try {
    const userId = req.user?.Userid || req.query.UserId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const publications = await StudentPublication.findAll({
      where: { tutor_verification_status: true, Userid: userId },
      order: [["verified_at", "DESC"]],
    });

    res.status(200).json({ success: true, count: publications.length, publications });
  } catch (error) {
    console.error("Error fetching verified publications:", error);
    res.status(500).json({ message: "Error fetching verified publications" });
  }
};

// Verify publication
export const verifyPublication = async (req, res) => {
  try {
    const { id } = req.params;
    const { Userid, verification_comments } = req.body;

    const publication = await StudentPublication.findByPk(id);
    if (!publication) {
      return res.status(404).json({ message: "Publication not found" });
    }

    publication.tutor_verification_status = true;
    publication.pending = false;
    publication.Verified_by = Userid;
    publication.verified_at = new Date();
    publication.verification_comments = verification_comments || null;

    await publication.save();

    // Send verification email to student
    const user = await User.findByPk(publication.Userid);
    if (user && user.email) {
      const emailText = `Dear ${user.username},\n\nYour publication has been verified.\n\nPublication: ${publication.title}\nType: ${publication.publication_type}\nStatus: ${publication.publication_status}\n\nComments: ${verification_comments || "None"}\n\nBest Regards,\nPublication Management System`;

      await sendEmail({
        to: user.email,
        subject: "Publication Verified",
        text: emailText,
      });
    }

    res.status(200).json({ message: "Publication verified successfully", publication });
  } catch (error) {
    console.error("❌ Error verifying publication:", error);
    res.status(500).json({ message: "Error verifying publication", error: error.message });
  }
};

// Delete publication
export const deletePublication = async (req, res) => {
  try {
    const { id } = req.params;
    const { Userid } = req.body;

    const publication = await StudentPublication.findByPk(id);
    if (!publication) {
      return res.status(404).json({ message: "Publication not found" });
    }

    // Check authorization
    if (publication.Userid !== parseInt(Userid)) {
      return res.status(403).json({ message: "Unauthorized to delete this publication" });
    }

    const user = await User.findByPk(publication.Userid);

    await publication.destroy();

    // Send deletion notification
    if (user && user.email) {
      const emailText = `Dear ${user.username},\n\nYour publication has been deleted.\n\nTitle: ${publication.title}\n\nIf this was an error, please contact your tutor.\n\nBest Regards,\nPublication Management System`;

      await sendEmail({
        to: user.email,
        subject: "Publication Deleted",
        text: emailText,
      });
    }

    res.status(200).json({ message: "Publication deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting publication:", error);
    res.status(500).json({ message: "Error deleting publication", error: error.message });
  }
};

// Get all publications (Admin/Tutor)
export const getAllPublications = async (req, res) => {
  try {
    const publications = await StudentPublication.findAll({
      include: [
        {
          model: User,
          as: "organizer",
          attributes: ["Userid", "username", "userMail"],
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              attributes: ["registerNumber", "staffId"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formatted = publications.map((pub) => {
      const { organizer, ...rest } = pub.get({ plain: true });
      return {
        ...rest,
        username: organizer?.username || "N/A",
        email: organizer?.userMail || "N/A",
        registerNumber: organizer?.studentDetails?.registerNumber || "N/A",
        staffId: organizer?.studentDetails?.staffId || "N/A",
      };
    });

    res.status(200).json({ success: true, count: formatted.length, publications: formatted });
  } catch (error) {
    console.error("Error fetching all publications:", error);
    res.status(500).json({ message: "Error fetching publications" });
  }
};