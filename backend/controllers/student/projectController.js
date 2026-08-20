import { User, StudentDetails, Project } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";

// Helper function to validate URLs
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Add a new project
export const addProject = async (req, res) => {
  try {
    console.log("📥 Received project data:", req.body);

    const {
      title,
      domain,
      link,
      description,
      techstack,
      start_date,
      end_date,
      github_link,
      team_members,
      status,
      Userid,
    } = req.body;

    // Validate required fields
    if (!Userid || !title || !domain || !description) {
      console.error("❌ Missing required fields");
      return res.status(400).json({
        message: "Title, domain, description, and Userid are required",
        missing: {
          Userid: !Userid,
          title: !title,
          domain: !domain,
          description: !description
        }
      });
    }

    // Validate domain
    if (typeof domain !== 'string' || domain.trim().length === 0) {
      return res.status(400).json({ message: "Domain must be a non-empty string" });
    }
    if (domain.length > 100) {
      return res.status(400).json({ message: "Domain must be less than 100 characters" });
    }

    // Validate status if provided
    const validStatuses = ['In Progress', 'Completed', 'On Hold', 'Archived'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid project status" });
    }

    // Validate URLs if provided
    if (link && !isValidUrl(link)) {
      return res.status(400).json({ message: "Invalid project link URL" });
    }
    if (github_link && !isValidUrl(github_link)) {
      return res.status(400).json({ message: "Invalid GitHub link URL" });
    }

    // Handle techstack - ensure it's an array
    let techs = techstack;
    if (techstack) {
      if (typeof techstack === 'string') {
        try {
          techs = JSON.parse(techstack);
        } catch (e) {
          techs = techstack.split(',').map(t => t.trim()).filter(t => t);
        }
      }
      if (!Array.isArray(techs)) {
        techs = [techs];
      }
    } else {
      techs = [];
    }

    console.log("✅ Validation passed");

    // Fetch user details
    const user = await User.findByPk(Userid);
    if (!user || !user.userMail) {
      console.error("❌ User not found");
      return res.status(404).json({ message: "Student email not found" });
    }

    // Fetch student details
    const student = await StudentDetails.findOne({ where: { Userid } });
    if (!student || !student.tutorEmail) {
      console.error("❌ Student details or tutor email not found");
      return res.status(404).json({ message: "Tutor email not found" });
    }

    console.log("✅ Creating project...");

    // Create project
    const project = await Project.create({
      Userid,
      title,
      domain: domain.trim(),
      link: link || null,
      description,
      techstack: techs,
      start_date: start_date || null,
      end_date: end_date || null,
      github_link: github_link || null,
      team_members: team_members || 1,
      status: status || 'In Progress',
      pending: true,
      tutor_approval_status: false,
      Approved_by: null,
      approved_at: null,
      Created_by: user.Userid,
      Updated_by: user.Userid,
    });

    console.log("✅ Project created:", project.id);

    // Send email to tutor
    try {
      const techstackStr = Array.isArray(techs) ? techs.join(', ') : 'Not specified';
      const emailText = `Dear Tutor,

A student has submitted a new project for your approval.

Student Details:
registerNumber: ${student.registerNumber}
Name: ${user.userName || "N/A"}

Project Details:
Title: ${title}
Domain: ${domain}
Description: ${description}
Techstack: ${techstackStr}
Link: ${link || "N/A"}
GitHub Link: ${github_link || "N/A"}
Team Members: ${team_members || 1}
Status: ${status || "In Progress"}
Start Date: ${start_date || "N/A"}
End Date: ${end_date || "N/A"}

The project is currently pending your approval. Please review and approve or reject.

Best Regards,
Project Management System`;

      await sendEmail({
        from: user.userMail,
        to: student.tutorEmail,
        subject: "New Project Submitted - Pending Approval",
        text: emailText,
      });
      console.log("✅ Email sent to tutor");
    } catch (emailError) {
      console.error("⚠️ Email sending failed (non-critical):", emailError.message);
    }

    res.status(201).json({
      message: "Project submitted for approval. Tutor notified.",
      project,
    });
  } catch (error) {
    console.error("❌❌❌ ERROR ADDING PROJECT ❌❌❌");
    console.error("Error Type:", error.name);
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);

    // Sequelize specific errors
    if (error.name === 'SequelizeDatabaseError') {
      console.error("💥 Database Error:", error.original?.sqlMessage || error.original);
      console.error("SQL:", error.sql);

      return res.status(500).json({
        message: "Database error while adding project",
        error: error.original?.sqlMessage || error.message,
        hint: "Check if the database schema matches the model. Domain should be VARCHAR(100)."
      });
    }

    if (error.name === 'SequelizeValidationError') {
      console.error("💥 Validation Error:", error.errors);
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }

    res.status(500).json({
      message: "Error adding project",
      error: error.message,
      type: error.name
    });
  }
};

// Update project
export const updateProject = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    domain,
    link,
    description,
    techstack,
    start_date,
    end_date,
    github_link,
    team_members,
    status,
    Userid,
  } = req.body;

  try {
    console.log("📝 Updating project:", id);

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check authorization
    if (project.Userid !== parseInt(Userid)) {
      return res.status(403).json({ message: "Unauthorized to update this project" });
    }

    // Validate domain if provided
    if (domain) {
      if (typeof domain !== 'string' || domain.trim().length === 0) {
        return res.status(400).json({ message: "Domain must be a non-empty string" });
      }
      if (domain.length > 100) {
        return res.status(400).json({ message: "Domain must be less than 100 characters" });
      }
    }

    // Validate status if provided
    const validStatuses = ['In Progress', 'Completed', 'On Hold', 'Archived'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid project status" });
    }

    // Validate URLs if provided
    if (link && !isValidUrl(link)) {
      return res.status(400).json({ message: "Invalid project link URL" });
    }
    if (github_link && !isValidUrl(github_link)) {
      return res.status(400).json({ message: "Invalid GitHub link URL" });
    }

    const user = await User.findByPk(Userid);
    const student = await StudentDetails.findOne({ where: { Userid } });
    if (!user || !student) {
      return res.status(404).json({ message: "User or Student details not found" });
    }

    // Handle techstack
    let techs = techstack;
    if (techstack) {
      if (typeof techstack === 'string') {
        try {
          techs = JSON.parse(techstack);
        } catch (e) {
          techs = techstack.split(',').map(t => t.trim()).filter(t => t);
        }
      }
      if (!Array.isArray(techs)) {
        techs = [techs];
      }
    }

    // Update fields
    project.title = title ?? project.title;
    project.domain = domain ? domain.trim() : project.domain;
    project.link = link ?? project.link;
    project.description = description ?? project.description;
    project.techstack = techs ?? project.techstack;
    project.start_date = start_date ?? project.start_date;
    project.end_date = end_date ?? project.end_date;
    project.github_link = github_link ?? project.github_link;
    project.team_members = team_members ?? project.team_members;
    project.status = status ?? project.status;
    project.Updated_by = Userid;
    project.pending = true;
    project.tutor_approval_status = false;
    project.Approved_by = null;
    project.approved_at = null;

    await project.save();
    console.log("✅ Project updated");

    // Send update email to tutor
    if (student.tutorEmail) {
      try {
        const techstackStr = Array.isArray(project.techstack) ? project.techstack.join(', ') : 'Not specified';
        const emailText = `Dear Tutor,

A student has updated their project details.

Student Details:
registerNumber: ${student.registerNumber}
Name: ${user.username || "N/A"}

Updated Project Details:
Title: ${project.title}
Domain: ${project.domain}
Description: ${project.description}
Techstack: ${techstackStr}
Status: ${project.status}

This project is now pending approval. Please review the updated details.

Best Regards,
Project Management System`;

        await sendEmail({
          from: user.userMail,
          to: student.tutorEmail,
          subject: "Project Updated - Requires Review",
          text: emailText,
        });
      } catch (emailError) {
        console.error("⚠️ Email sending failed:", emailError.message);
      }
    }

    res.status(200).json({
      message: "Project updated successfully. Tutor notified.",
      project,
    });
  } catch (error) {
    console.error("❌ Error updating project:", error);
    res.status(500).json({ message: "Error updating project", error: error.message });
  }
};

// Get pending projects
export const getPendingProjects = async (req, res) => {
  try {
    const pendingProjects = await Project.findAll({
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

    const formattedProjects = pendingProjects.map((project) => {
      const { organizer, ...rest } = project.get({ plain: true });
      return {
        ...rest,
        username: organizer?.userName || "N/A",
        registerNumber: organizer?.studentDetails?.registerNumber || "N/A",
        staffId: organizer?.studentDetails?.staffId || "N/A",
      };
    });

    res.status(200).json({ success: true, projects: formattedProjects });
  } catch (error) {
    console.error("Error fetching pending projects:", error.message);
    res.status(500).json({ success: false, message: "Error fetching pending projects" });
  }
};

// Get approved projects
export const getApprovedProjects = async (req, res) => {
  const userId = req.user?.Userid || req.query.UserId;
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const approvedProjects = await Project.findAll({
      where: { tutor_approval_status: true, Userid: userId },
      order: [["approved_at", "DESC"]],
    });

    return res.status(200).json({ success: true, projects: approvedProjects });
  } catch (error) {
    console.error("Error fetching approved projects:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Approve project
export const approveProject = async (req, res) => {
  const { id } = req.params;
  const { Userid, comments, rating } = req.body;

  try {
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    project.tutor_approval_status = true;
    project.pending = false;
    project.Approved_by = Userid;
    project.approved_at = new Date();
    project.comments = comments || null;
    project.rating = rating || null;

    await project.save();

    // Send approval email to student
    const user = await User.findByPk(project.Userid);
    if (user && user.email) {
      try {
        const techstackStr = Array.isArray(project.techstack) ? project.techstack.join(', ') : 'Not specified';
        const emailText = `Dear ${user.username},

Your project has been approved!

Project: ${project.title}
Domain: ${project.domain}
Techstack: ${techstackStr}
Rating: ${rating ? rating + '/5' : "Not rated"}

Comments: ${comments || "None"}

Well done on your excellent work!

Best Regards,
Project Management System`;

        await sendEmail({
          to: user.email,
          subject: "Project Approved Successfully",
          text: emailText,
        });
      } catch (emailError) {
        console.error("⚠️ Email sending failed:", emailError.message);
      }
    }

    res.status(200).json({ message: "Project approved successfully", project });
  } catch (error) {
    console.error("❌ Error approving project:", error);
    res.status(500).json({ message: "Error approving project", error: error.message });
  }
};

// Reject project
export const rejectProject = async (req, res) => {
  const { id } = req.params;
  const { Userid, comments } = req.body;

  try {
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    project.tutor_approval_status = false;
    project.pending = false;
    project.Approved_by = Userid;
    project.approved_at = new Date();
    project.comments = comments || "Rejected";

    await project.save();

    // Send rejection email to student
    const user = await User.findByPk(project.Userid);
    if (user && user.email) {
      try {
        const emailText = `Dear ${user.username},

Your project has been rejected.

Project: ${project.title}
Domain: ${project.domain}

Reason: ${comments || "No comments provided"}

You can update and resubmit your project after making necessary changes.

Best Regards,
Project Management System`;

        await sendEmail({
          to: user.email,
          subject: "Project Rejected - Please Review",
          text: emailText,
        });
      } catch (emailError) {
        console.error("⚠️ Email sending failed:", emailError.message);
      }
    }

    res.status(200).json({ message: "Project rejected successfully", project });
  } catch (error) {
    console.error("❌ Error rejecting project:", error);
    res.status(500).json({ message: "Error rejecting project", error: error.message });
  }
};

// Delete project
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const student = await StudentDetails.findOne({ where: { Userid: project.Userid } });
    const user = await User.findByPk(project.Userid);

    await project.destroy();
    console.log("✅ Project deleted");

    // Send deletion notification to student
    if (user && user.email) {
      try {
        const emailText = `Dear ${user.username},

Your project has been deleted.

Project Title: ${project.title}
Domain: ${project.domain}

If this was an error, please contact your tutor.

Best Regards,
Project Management System`;

        await sendEmail({
          to: user.email,
          subject: "Project Deleted Notification",
          text: emailText,
        });
      } catch (emailError) {
        console.error("⚠️ Email sending failed:", emailError.message);
      }
    }

    // Send deletion notification to tutor
    if (student && student.tutorEmail) {
      try {
        const emailText = `Dear Tutor,

The following project has been deleted:

Student: ${user?.username || "N/A"}
registerNumber: ${student.registerNumber}
Project: ${project.title}
Domain: ${project.domain}

Best Regards,
Project Management System`;

        await sendEmail({
          to: student.tutorEmail,
          subject: "Project Deleted Notification",
          text: emailText,
        });
      } catch (emailError) {
        console.error("⚠️ Email sending failed:", emailError.message);
      }
    }

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting project:", error);
    res.status(500).json({ message: "Error deleting project", error: error.message });
  }
};

// Get all projects for a student
export const getStudentProjects = async (req, res) => {
  const userId = req.user?.Userid || req.query.UserId;

  console.log("📥 Get student projects - User ID:", userId);

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const projects = await Project.findAll({
      where: { Userid: userId },
      order: [["createdAt", "DESC"]],
    });

    console.log(`✅ Found ${projects.length} projects for user ${userId}`);

    res.status(200).json({ success: true, projects });
  } catch (error) {
    console.error("Error fetching student projects:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get projects by domain
export const getProjectsByDomain = async (req, res) => {
  const { domain } = req.params;
  const userId = req.user?.Userid || req.query.UserId;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const projects = await Project.findAll({
      where: { Userid: userId, domain },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ success: true, projects });
  } catch (error) {
    console.error("Error fetching projects by domain:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get project statistics
export const getProjectStatistics = async (req, res) => {
  const userId = req.user?.Userid || req.query.UserId;
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const projects = await Project.findAll({
      where: { Userid: userId, tutor_approval_status: true },
    });

    const stats = {
      totalProjects: projects.length,
      completedProjects: projects.filter(p => p.status === 'Completed').length,
      inProgressProjects: projects.filter(p => p.status === 'In Progress').length,
      onHoldProjects: projects.filter(p => p.status === 'On Hold').length,
      archivedProjects: projects.filter(p => p.status === 'Archived').length,
      averageRating: projects.filter(p => p.rating).length > 0
        ? (projects.reduce((sum, p) => sum + (p.rating || 0), 0) / projects.filter(p => p.rating).length).toFixed(2)
        : 0,
      byDomain: {},
      topTechnologies: {},
    };

    // Count by domain
    projects.forEach(project => {
      if (!stats.byDomain[project.domain]) {
        stats.byDomain[project.domain] = 0;
      }
      stats.byDomain[project.domain]++;
    });

    // Count technologies
    projects.forEach(project => {
      if (Array.isArray(project.techstack)) {
        project.techstack.forEach(tech => {
          if (!stats.topTechnologies[tech]) {
            stats.topTechnologies[tech] = 0;
          }
          stats.topTechnologies[tech]++;
        });
      }
    });

    res.status(200).json({ success: true, statistics: stats });
  } catch (error) {
    console.error("Error fetching project statistics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};