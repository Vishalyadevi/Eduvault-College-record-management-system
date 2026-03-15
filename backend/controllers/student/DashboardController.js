import { User, Achievement, StudentDetails, StudentLeave, Internship, Message, Scholarship, EventOrganized, EventAttended, OnlineCourses, StudentNonCGPA, SkillRack, NPTELCourse, Project, HackathonEvent, Extracurricular, StudentPublication, CompetencyCoding } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";

// === EXISTING APPROVAL FUNCTIONS (Keep as is) ===

export const tutorApproveInternship = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, message } = req.body;
    console.log(`Internship ID: ${id}, Approved: ${approved}, Message: ${message}`);

    const internshipId = parseInt(id, 10);
    const currentTutorId = req.user?.userId || req.user?.Userid;
    if (!currentTutorId) {
      return res.status(401).json({ message: "Unauthorized: Tutor ID missing." });
    }

    const internship = await Internship.findByPk(internshipId, {
      include: [
        { model: User, as: "internUser", attributes: ["userId", "userName", "userMail"] },
        { model: User, as: "tutor", attributes: ["userId", "userName"] },
      ],
    });
    if (!internship) {
      return res.status(404).json({ message: "Internship not found." });
    }

    const student = internship.internUser;
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const tutor = await User.findByPk(currentTutorId, { attributes: ["userName"] });
    const tutorName = tutor?.userName || "Tutor";

    await internship.update({
      tutor_approval_status: approved,
      approved_at: new Date(),
      pending: false,
    });

    const studentEmail = student.userMail;
    if (studentEmail) {
      await sendEmail({
        to: studentEmail,
        subject: approved ? "Internship Approved" : "Internship Rejected",
        text: `Dear ${student.userName},\n\nYour internship at ${internship.provider_name} has been ${approved ? "approved" : "rejected"} by your tutor (${tutorName}).\n\nMessage: ${message || "No additional message provided."}\n\nBest Regards,\nInternship Approval Team`,
      });
    }

    res.json({ message: `Internship ${approved ? "approved" : "rejected"} successfully.` });
  } catch (error) {
    console.error("❌ Error processing approval:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const sendMessageToStudent = async (req, res) => {
  try {
    const { email, message, type } = req.body;
    if (!email || !message || !type) {
      return res.status(400).json({ message: "Email, message, and type are required." });
    }

    const student = await User.findOne({ where: { userMail: email } });
    if (!student) return res.status(404).json({ message: "Student not found." });

    const currentTutorId = req.user?.userId || req.user?.Userid;
    const tutor = await User.findByPk(currentTutorId);
    if (!tutor) return res.status(404).json({ message: "Tutor not found." });

    const newMessage = await Message.create({
      sender_id: tutor.userId,
      receiver_id: student.userId,
      message,
      type,
    });

    const emailSent = await sendEmail({
      to: student.userMail,
      subject: `${type} Notification`,
      html: `
        <p>Dear <strong>${student.userName}</strong>,</p>
        <p>You have received a <strong style="color: ${type === "Warning" ? "red" : "blue"}">${type}</strong> from your tutor, <strong>${tutor.userName}</strong>:</p>
        <blockquote style="border-left: 4px solid ${type === "Warning" ? "red" : "blue"}; padding: 10px;">
          ${message}
        </blockquote>
        <p><strong>Best Regards,</strong><br>${tutor.userName}</p>
      `,
    });

    if (emailSent) {
      res.json({ message: `${type} sent successfully.`, alert: type === "Warning" });
    } else {
      res.status(500).json({ message: "Message saved, but email failed to send." });
    }
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesForStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const internship = await Internship.findByPk(id);
    if (!internship) {
      return res.status(404).json({ message: "Internship not found." });
    }
    const messages = internship.messages ? JSON.parse(internship.messages) : [];
    res.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const tutorApproveScholarship = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, message } = req.body;
    const scholarshipId = parseInt(id, 10);

    const currentTutorId = req.user?.userId || req.user?.Userid;
    if (!currentTutorId) {
      return res.status(401).json({ message: "Unauthorized: Tutor ID missing." });
    }

    const scholarship = await Scholarship.findByPk(scholarshipId, {
      include: [
        { model: User, as: "student", attributes: ["userId", "userName", "userMail"] },
        { model: User, as: "tutor", attributes: ["userId", "userName"] },
      ],
    });

    if (!scholarship) {
      return res.status(404).json({ message: "Scholarship not found." });
    }

    const student = scholarship.student;
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const tutor = await User.findByPk(currentTutorId, { attributes: ["userName"] });
    const tutorName = tutor?.userName || "Tutor";

    await scholarship.update({
      tutor_approval_status: approved,
      approved_at: new Date(),
      Approved_by: currentTutorId,
      pending: false,
    });

    const studentEmail = student.userMail;
    if (studentEmail) {
      await sendEmail({
        to: studentEmail,
        subject: approved ? "Scholarship Approved" : "Scholarship Rejected",
        text: `Dear ${student.userName},\n\nYour scholarship application for ${scholarship.name} has been ${approved ? "approved" : "rejected"} by your tutor (${tutorName}).\n\nMessage: ${message || "No additional message provided."}\n\nBest Regards,\nScholarship Approval Team`,
      });
    }

    res.json({ message: `Scholarship ${approved ? "approved" : "rejected"} successfully.` });
  } catch (error) {
    console.error("❌ Error processing scholarship approval:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const tutorApproveEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, message } = req.body;
    const eventId = parseInt(id, 10);

    const currentTutorId = req.user?.userId || req.user?.Userid;
    if (!currentTutorId) {
      return res.status(401).json({ message: "Unauthorized: Tutor ID missing." });
    }

    const event = await EventOrganized.findByPk(eventId, {
      include: [
        { model: User, as: "organizer", attributes: ["userId", "userName", "userMail"] },
        { model: User, as: "tutor", attributes: ["userId", "userName"] },
      ],
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    const organizer = event.organizer;
    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found." });
    }

    const tutor = await User.findByPk(currentTutorId, { attributes: ["userName"] });
    const tutorName = tutor?.userName || "Tutor";

    await event.update({
      tutor_approval_status: approved,
      approved_at: new Date(),
      Approved_by: currentTutorId,
      pending: false,
    });

    const organizerEmail = organizer.userMail;
    if (organizerEmail) {
      await sendEmail({
        to: organizerEmail,
        subject: approved ? "Event Approved" : "Event Rejected",
        text: `Dear ${organizer.userName},\n\nYour event "${event.event_name}" has been ${approved ? "approved" : "rejected"} by your tutor (${tutorName}).\n\nMessage: ${message || "No additional message provided."}\n\nBest Regards,\nEvent Approval Team`,
      });
    }

    res.json({ message: `Event ${approved ? "approved" : "rejected"} successfully.` });
  } catch (error) {
    console.error("❌ Error processing event approval:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const tutorApproveEventAttended = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, message } = req.body;
    const eventAttendedId = parseInt(id, 10);

    const currentTutorId = req.user?.userId || req.user?.Userid;
    if (!currentTutorId) {
      return res.status(401).json({ message: "Unauthorized: Tutor ID missing." });
    }

    const eventAttended = await EventAttended.findByPk(eventAttendedId, {
      include: [
        { model: User, as: "eventUser", attributes: ["userId", "userName", "userMail"] },
        { model: User, as: "tutor", attributes: ["userId", "userName"] },
      ],
    });

    if (!eventAttended) {
      return res.status(404).json({ message: "Event attended not found." });
    }

    const student = eventAttended.eventUser;
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const tutor = await User.findByPk(currentTutorId, { attributes: ["userName"] });
    const tutorName = tutor?.userName || "Tutor";

    await eventAttended.update({
      tutor_approval_status: approved,
      approved_at: new Date(),
      Approved_by: currentTutorId,
      pending: false,
    });

    const studentEmail = student.userMail;
    if (studentEmail) {
      await sendEmail({
        to: studentEmail,
        subject: approved ? "Event Attended Approved" : "Event Attended Rejected",
        text: `Dear ${student.userName},\n\nYour participation in the event "${eventAttended.event_name}" has been ${approved ? "approved" : "rejected"} by your tutor (${tutorName}).\n\nMessage: ${message || "No additional message provided."}\n\nBest Regards,\nEvent Approval Team`,
      });
    }

    res.json({ message: `Event attended ${approved ? "approved" : "rejected"} successfully.` });
  } catch (error) {
    console.error("❌ Error processing event attended approval:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const tutorApproveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, message } = req.body;
    const leaveId = parseInt(id, 10);

    const currentTutorId = req.user?.userId || req.user?.Userid;
    if (!currentTutorId) {
      return res.status(401).json({ message: "Unauthorized: Tutor ID missing." });
    }

    const leaveRequest = await StudentLeave.findByPk(leaveId, {
      include: [
        { model: User, as: "LeaveUser", attributes: ["userId", "userName", "userMail"] },
        { model: User, as: "tutor", attributes: ["userId", "userName"] },
      ],
    });

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found." });
    }

    const student = leaveRequest.LeaveUser;
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const tutor = await User.findByPk(currentTutorId, { attributes: ["userName"] });
    const tutorName = tutor?.userName || "Tutor";

    await leaveRequest.update({
      tutor_approval_status: approved,
      approved_at: new Date(),
      Approved_by: currentTutorId,
      leave_status: approved ? "approved" : "rejected"
    });

    const studentEmail = student.userMail;
    if (studentEmail) {
      await sendEmail({
        to: studentEmail,
        subject: approved ? "Leave Request Approved" : "Leave Request Rejected",
        text: `Dear ${student.userName},\n\nYour leave request for ${leaveRequest.reason} has been ${approved ? "approved" : "rejected"} by your tutor (${tutorName}).\n\nMessage: ${message || "No additional message provided."}\n\nBest Regards,\nLeave Approval Team`,
      });
    }

    res.json({ message: `Leave request ${approved ? "approved" : "rejected"} successfully.` });
  } catch (error) {
    console.error("❌ Error processing leave request approval:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const tutorApproveOnlineCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, message } = req.body;
    const courseId = parseInt(id, 10);

    const currentTutorId = req.user?.userId || req.user?.Userid;
    if (!currentTutorId) {
      return res.status(401).json({ message: "Unauthorized: Tutor ID missing." });
    }

    const course = await OnlineCourses.findByPk(courseId, {
      include: [
        { model: User, as: "student", attributes: ["userId", "userName", "userMail"] },
        { model: User, as: "tutor", attributes: ["userId", "userName"] },
      ],
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    const student = course.student;
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const tutor = await User.findByPk(currentTutorId, { attributes: ["userName"] });
    const tutorName = tutor?.userName || "Tutor";

    await course.update({
      tutor_approval_status: approved,
      approved_at: new Date(),
      pending: false,
    });

    const studentEmail = student.userMail;
    if (studentEmail) {
      await sendEmail({
        to: studentEmail,
        subject: approved ? "Online Course Approved" : "Online Course Rejected",
        text: `Dear ${student.userName},\n\nYour online course "${course.course_name}" has been ${approved ? "approved" : "rejected"} by your tutor (${tutorName}).\n\nMessage: ${message || "No additional message provided."}\n\nBest Regards,\nOnline Course Approval Team`,
      });
    }

    res.json({ message: `Online course ${approved ? "approved" : "rejected"} successfully.` });
  } catch (error) {
    console.error("❌ Error processing approval:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const tutorApproveAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, message } = req.body;
    const achievementId = parseInt(id, 10);

    const currentTutorId = req.user?.userId || req.user?.Userid;
    if (!currentTutorId) {
      return res.status(401).json({ message: "Unauthorized: Tutor ID missing." });
    }

    const achievement = await Achievement.findByPk(achievementId, {
      include: [
        { model: User, as: "student", attributes: ["userId", "userName", "userMail"] },
        { model: User, as: "creator", attributes: ["userId", "userName"] },
        { model: User, as: "approver", attributes: ["userId", "userName"] }
      ],
    });

    if (!achievement) {
      return res.status(404).json({ message: "Achievement not found." });
    }

    const student = achievement.student;
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const tutor = await User.findByPk(currentTutorId, { attributes: ["userName"] });
    const tutorName = tutor?.userName || "Tutor";

    await achievement.update({
      tutor_approval_status: approved,
      approved_at: new Date(),
      Approved_by: currentTutorId,
      pending: false,
    });

    const studentEmail = student.userMail;
    if (studentEmail) {
      await sendEmail({
        to: studentEmail,
        subject: approved ? "Achievement Approved" : "Achievement Rejected",
        text: `Dear ${student.userName},\n\nYour achievement "${achievement.title}" has been ${approved ? "approved" : "rejected"} by your tutor (${tutorName}).\n\nMessage: ${message || "No additional message provided."}\n\nBest Regards,\nAchievement Approval Team`,
      });
    }

    res.json({ message: `Achievement ${approved ? "approved" : "rejected"} successfully.` });
  } catch (error) {
    console.error("❌ Error processing achievement approval:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const tutorApproveProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, message } = req.body;
    const currentTutorId = req.user?.userId || req.user?.Userid;

    const project = await Project.findByPk(id, {
      include: [{ model: User, as: "organizer", attributes: ["userId", "userName", "userMail"] }]
    });

    if (!project) return res.status(404).json({ message: "Project not found." });

    await project.update({
      tutor_approval_status: approved,
      approved_at: new Date(),
      Approved_by: currentTutorId,
      pending: false,
      comments: message || null
    });

    const student = project.organizer;
    if (student?.userMail) {
      await sendEmail({
        to: student.userMail,
        subject: approved ? "Project Approved" : "Project Rejected",
        text: `Dear ${student.userName},\n\nYour project "${project.title}" has been ${approved ? "approved" : "rejected"}.\n\nMessage: ${message || "No additional message provided."}`,
      });
    }

    res.json({ message: `Project ${approved ? "approved" : "rejected"} successfully.` });
  } catch (error) {
    console.error("❌ Error approving project:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const tutorApproveHackathon = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, message } = req.body;
    const currentTutorId = req.user?.userId || req.user?.Userid;

    const event = await HackathonEvent.findByPk(id, {
      include: [{ model: User, as: "organizer", attributes: ["userId", "userName", "userMail"] }]
    });

    if (!event) return res.status(404).json({ message: "Hackathon event not found." });

    await event.update({
      tutor_approval_status: approved,
      approved_at: new Date(),
      Approved_by: currentTutorId,
      pending: false,
      comments: message || null
    });

    const student = event.organizer;
    if (student?.userMail) {
      await sendEmail({
        to: student.userMail,
        subject: approved ? "Hackathon Approved" : "Hackathon Rejected",
        text: `Dear ${student.userName},\n\nYour hackathon "${event.event_name}" has been ${approved ? "approved" : "rejected"}.\n\nMessage: ${message || "No additional message provided."}`,
      });
    }

    res.json({ message: `Hackathon ${approved ? "approved" : "rejected"} successfully.` });
  } catch (error) {
    console.error("❌ Error approving hackathon:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const tutorApproveExtracurricular = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, message } = req.body;
    const currentTutorId = req.user?.userId || req.user?.Userid;

    const activity = await Extracurricular.findByPk(id, {
      include: [{ model: User, as: "organizer", attributes: ["userId", "userName", "userMail"] }]
    });

    if (!activity) return res.status(404).json({ message: "Activity not found." });

    await activity.update({
      tutor_approval_status: approved,
      approved_at: new Date(),
      Approved_by: currentTutorId,
      pending: false,
      comments: message || null
    });

    const student = activity.organizer;
    if (student?.userMail) {
      await sendEmail({
        to: student.userMail,
        subject: approved ? "Activity Approved" : "Activity Rejected",
        text: `Dear ${student.userName},\n\nYour extracurricular activity "${activity.activity_name}" has been ${approved ? "approved" : "rejected"}.\n\nMessage: ${message || "No additional message provided."}`,
      });
    }

    res.json({ message: `Activity ${approved ? "approved" : "rejected"} successfully.` });
  } catch (error) {
    console.error("❌ Error approving extracurricular:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const tutorApprovePublication = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, message } = req.body;
    const currentTutorId = req.user?.userId || req.user?.Userid;

    const publication = await StudentPublication.findByPk(id, {
      include: [{ model: User, as: "organizer", attributes: ["userId", "userName", "userMail"] }]
    });

    if (!publication) return res.status(404).json({ message: "Publication not found." });

    await publication.update({
      tutor_verification_status: approved,
      verified_at: new Date(),
      Verified_by: currentTutorId,
      pending: false,
      verification_comments: message || null
    });

    const student = publication.organizer;
    if (student?.userMail) {
      await sendEmail({
        to: student.userMail,
        subject: approved ? "Publication Verified" : "Publication Rejected",
        text: `Dear ${student.userName},\n\nYour publication "${publication.title}" has been ${approved ? "verified" : "rejected"}.\n\nMessage: ${message || "No additional message provided."}`,
      });
    }

    res.json({ message: `Publication ${approved ? "verified" : "rejected"} successfully.` });
  } catch (error) {
    console.error("❌ Error verifying publication:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const tutorApproveCompetencyCoding = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, message } = req.body;
    const currentTutorId = req.user?.userId || req.user?.Userid;

    const record = await CompetencyCoding.findByPk(id, {
      include: [{ model: User, as: "organizer", attributes: ["userId", "userName", "userMail"] }]
    });

    if (!record) return res.status(404).json({ message: "Competency record not found." });

    await record.update({
      tutor_verification_status: approved,
      verified_at: new Date(),
      Verified_by: currentTutorId,
      pending: false,
      verification_comments: message || null
    });

    const student = record.organizer;
    if (student?.userMail) {
      await sendEmail({
        to: student.userMail,
        subject: approved ? "Competency Record Verified" : "Competency Record Rejected",
        text: `Dear ${student.userName},\n\nYour competency coding record has been ${approved ? "verified" : "rejected"}.\n\nMessage: ${message || "No additional message provided."}`,
      });
    }

    res.json({ message: `Competency record ${approved ? "verified" : "rejected"} successfully.` });
  } catch (error) {
    console.error("❌ Error verifying competency record:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const tutorApproveNonCGPA = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, message } = req.body;
    const currentTutorId = req.user?.userId || req.user?.Userid;

    const record = await StudentNonCGPA.findByPk(id, {
      include: [{ model: User, as: "student", attributes: ["userId", "userName", "userMail"] }]
    });

    if (!record) return res.status(404).json({ message: "Non-CGPA record not found." });

    await record.update({
      tutor_verification_status: approved,
      verified_at: new Date(),
      Verified_by: currentTutorId,
      pending: false,
      verification_comments: message || null
    });

    const student = record.student;
    if (student?.userMail) {
      await sendEmail({
        to: student.userMail,
        subject: approved ? "Non-CGPA Course Verified" : "Non-CGPA Course Rejected",
        text: `Dear ${student.userName},\n\nYour non-CGPA course "${record.course_name}" has been ${approved ? "verified" : "rejected"}.\n\nMessage: ${message || "No additional message provided."}`,
      });
    }

    res.json({ message: `Non-CGPA record ${approved ? "verified" : "rejected"} successfully.` });
  } catch (error) {
    console.error("❌ Error verifying non-CGPA record:", error);
    res.status(500).json({ message: "Server error" });
  }
};