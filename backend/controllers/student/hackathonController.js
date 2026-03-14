import { HackathonEvent, User, StudentDetails } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";

// GET: fetch student hackathon events
export const getStudentHackathonEvents = async (req, res) => {
  try {
    // Standardize User ID resolution
    const userId = req.user?.userId || req.user?.Userid || (req.query.UserId ? parseInt(req.query.UserId) : null);

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const studentHackathons = await HackathonEvent.findAll({
      where: { Userid: userId },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      events: studentHackathons,
    });
  } catch (error) {
    console.error('Error fetching student hackathon events:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student hackathon events",
      error: error.message,
    });
  }
};

// POST: add hackathon event
export const addHackathonEvent = async (req, res) => {
  try {
    // Standardize User ID resolution
    const userId = req.user?.userId || req.user?.Userid || (req.body.Userid ? parseInt(req.body.Userid) : null);

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required. Please log in again." });
    }

    const { event_name, organized_by, from_date, to_date, level_cleared, rounds, status } = req.body;

    if (!event_name || !organized_by || !from_date || !to_date || !level_cleared || !rounds || !status) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Fetch user and student details for tutor notification
    const user = await User.findByPk(userId);
    if (!user || !user.userMail) {
      return res.status(404).json({ success: false, message: "Student details not found for notification" });
    }

    const student = await StudentDetails.findOne({
      where: { Userid: userId },
      include: [{ model: User, as: "staffAdvisor", attributes: ["userMail", "userName"] }]
    });

    const tutorEmail = student?.tutorEmail || student?.staffAdvisor?.userMail;

    const newEvent = await HackathonEvent.create({
      Userid: userId,
      event_name,
      organized_by,
      from_date,
      to_date,
      level_cleared: parseInt(level_cleared),
      rounds: parseInt(rounds),
      status,
      Created_by: userId,
      Updated_by: userId,
      certificate: req.file ? req.file.buffer : null
    });

    // Send notification to tutor
    if (tutorEmail) {
      try {
        await sendEmail({
          from: user.userMail,
          to: tutorEmail,
          subject: "New Hackathon Event Added - Pending Approval",
          text: `Dear Tutor,

A new hackathon event has been added by ${user.userName || "a student"} and is pending your approval.

Event Details:
- Event Name: ${event_name}
- Organized By: ${organized_by}
- Dates: ${from_date} to ${to_date}
- Level Cleared: ${level_cleared}
- Rounds: ${rounds}
- Status: ${status}

Please review and approve the event in the system.

Best Regards,
Hackathon Management System`,
        });
      } catch (emailError) {
        console.error("Failed to send tutor notification email:", emailError);
      }
    }

    res.status(201).json({
      success: true,
      message: "Hackathon event added successfully",
      data: newEvent,
    });
  } catch (error) {
    console.error('Error adding hackathon event:', error);
    res.status(500).json({
      success: false,
      message: "Failed to add hackathon event",
      error: error.message,
    });
  }
};

// PUT: update hackathon event
export const updateHackathonEvent = async (req, res) => {
  try {
    const { id } = req.params;
    // Standardize User ID resolution
    const userId = req.user?.userId || req.user?.Userid || (req.body.Userid ? parseInt(req.body.Userid) : null);

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required. Please log in again." });
    }

    const { event_name, organized_by, from_date, to_date, level_cleared, rounds, status } = req.body;

    const event = await HackathonEvent.findByPk(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Hackathon event not found",
      });
    }

    // Check if the event is still pending (not approved/rejected)
    if (!event.pending) {
      return res.status(403).json({
        success: false,
        message: "Cannot update approved or rejected events",
      });
    }

    await event.update({
      event_name: event_name || event.event_name,
      organized_by: organized_by || event.organized_by,
      from_date: from_date || event.from_date,
      to_date: to_date || event.to_date,
      level_cleared: level_cleared ? parseInt(level_cleared) : event.level_cleared,
      rounds: rounds ? parseInt(rounds) : event.rounds,
      status: status || event.status,
      Updated_by: userId,
      certificate: req.file ? req.file.buffer : event.certificate
    });

    res.status(200).json({
      success: true,
      message: "Hackathon event updated successfully",
      data: event,
    });
  } catch (error) {
    console.error('Error updating hackathon event:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update hackathon event",
      error: error.message,
    });
  }
};

// DELETE: delete hackathon event
export const deleteHackathonEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await HackathonEvent.findByPk(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Hackathon event not found",
      });
    }

    // Check if the event is still pending (not approved/rejected)
    if (!event.pending && req.user?.roleId !== 2 && req.user?.roleId !== 3) { // Allow tutor/admin to delete if needed
      return res.status(403).json({
        success: false,
        message: "Cannot delete approved or rejected events",
      });
    }

    await event.destroy();

    res.status(200).json({
      success: true,
      message: "Hackathon event deleted successfully",
    });
  } catch (error) {
    console.error('Error deleting hackathon event:', error);
    res.status(500).json({
      success: false,
      message: "Failed to delete hackathon event",
      error: error.message,
    });
  }
};

// Approve hackathon event (Tutor/Admin)
export const approveHackathonEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const approverId = req.user?.userId || req.user?.Userid;

    if (!approverId) {
      return res.status(400).json({ success: false, message: "Approver ID is required" });
    }

    const event = await HackathonEvent.findByPk(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Hackathon event not found",
      });
    }

    await event.update({
      tutor_approval_status: true,
      Approved_by: approverId,
      approved_at: new Date(),
      comments: comments || null,
      pending: false
    });

    res.status(200).json({
      success: true,
      message: "Hackathon event approved successfully",
      data: event,
    });
  } catch (error) {
    console.error('Error approving hackathon event:', error);
    res.status(500).json({
      success: false,
      message: "Failed to approve hackathon event",
      error: error.message,
    });
  }
};

// Reject hackathon event (Tutor/Admin)
export const rejectHackathonEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const rejecterId = req.user?.userId || req.user?.Userid;

    if (!rejecterId) {
      return res.status(400).json({ success: false, message: "Approver ID is required" });
    }

    const event = await HackathonEvent.findByPk(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Hackathon event not found",
      });
    }

    await event.update({
      tutor_approval_status: false,
      Approved_by: rejecterId,
      approved_at: new Date(),
      comments: comments || null,
      pending: false
    });

    res.status(200).json({
      success: true,
      message: "Hackathon event rejected successfully",
      data: event,
    });
  } catch (error) {
    console.error('Error rejecting hackathon event:', error);
    res.status(500).json({
      success: false,
      message: "Failed to reject hackathon event",
      error: error.message,
    });
  }
};

// Get Pending Hackathon Events
export const getPendingHackathonEvents = async (req, res) => {
  try {
    const pendingHackathons = await HackathonEvent.findAll({
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
      order: [['createdAt', 'DESC']]
    });

    const formattedEvents = pendingHackathons.map((event) => {
      const { organizer, ...rest } = event.get({ plain: true });
      return {
        ...rest,
        studentName: organizer?.userName || "N/A",
        studentEmail: organizer?.userMail || "N/A",
        registerNumber: organizer?.studentDetails?.registerNumber || "N/A",
        staffId: organizer?.studentDetails?.staffId || "N/A",
      };
    });

    res.status(200).json({
      success: true,
      data: formattedEvents,
      events: formattedEvents // For backward compatibility if needed
    });
  } catch (error) {
    console.error('Error fetching pending hackathon events:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending hackathon events",
      error: error.message,
    });
  }
};

// Get Approved Hackathon Events
export const getApprovedHackathonEvents = async (req, res) => {
  try {
    const approvedEvents = await HackathonEvent.findAll({
      where: { pending: false, tutor_approval_status: true },
      include: [
        {
          model: User,
          as: "organizer",
          attributes: ["userId", "userName", "userMail"],
        },
      ],
      order: [['approved_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: approvedEvents,
      events: approvedEvents // For backward compatibility
    });
  } catch (error) {
    console.error('Error fetching approved hackathon events:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch approved hackathon events",
      error: error.message,
    });
  }
};

// Get Certificate
export const getCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await HackathonEvent.findByPk(id);

    if (!event || !event.certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    res.setHeader('Content-Type', 'application/pdf'); // Or dynamic if needed
    // res.setHeader('Content-Disposition', `attachment; filename="${event.event_name}_certificate.pdf"`);
    res.send(event.certificate);
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch certificate",
      error: error.message,
    });
  }
};

// Compatibility export
export const getStudentEvents = getStudentHackathonEvents;
