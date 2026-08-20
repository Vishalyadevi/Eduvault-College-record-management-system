import { User, StudentDetails, EventOrganized } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";

// Add a new event
export const addEvent = async (req, res) => {
  console.log("hi")
  try {
    const { event_name, club_name, role, staff_incharge, start_date, end_date, number_of_participants, mode, funding_agency, funding_amount, Userid } = req.body;
    console.log(req.body)
    // Standardize User ID resolution
    const userId = req.user?.userId || req.user?.Userid || (req.body.Userid ? parseInt(req.body.Userid) : null);

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Fetch user details with correct field names
    const user = await User.findByPk(userId);
    if (!user || !user.userMail) {
      return res.status(404).json({ message: "Student email not found" });
    }

    // Fetch student details with staffAdvisor association
    const student = await StudentDetails.findOne({
      where: { Userid: userId },
      include: [
        {
          model: User,
          as: "staffAdvisor",
          attributes: ["userMail", "userName"]
        }
      ]
    });

    const tutorEmail = student?.tutorEmail || student?.staffAdvisor?.userMail;
    if (!tutorEmail) {
      return res.status(404).json({ message: "Tutor email not found" });
    }

    // Create event
    const event = await EventOrganized.create({
      Userid: parseInt(userId),
      event_name,
      club_name,
      role,
      staff_incharge,
      start_date, // Updated field name
      end_date, // Updated field name
      number_of_participants: parseInt(number_of_participants),
      mode,
      funding_agency,
      funding_amount: funding_amount ? parseFloat(funding_amount) : null,
      pending: true,
      tutor_approval_status: false,
      Approved_by: null,
      approved_at: null,
      Created_by: userId,
      Updated_by: userId,
    });

    console.log("✅ Event Organized created successfully:", event.id);

    // Send email to tutor
    const emailResponse = await sendEmail({
      from: user.userMail,
      to: tutorEmail,
      subject: "New Event Organized Pending Approval",
      text: `Dear Tutor,

A student has submitted a new event organized record for your approval. 

Student Details:
- Registration Number: ${student?.registerNumber || "N/A"}
- Name: ${user.userName || "N/A"}

Event Details:
- Event Name: ${event_name}
- Club Name: ${club_name}
- Role: ${role}
- Staff Incharge: ${staff_incharge}
- Start Date: ${start_date}
- End Date: ${end_date}
- Participants: ${number_of_participants}
- Mode: ${mode}
- Funding Agency: ${funding_agency || "N/A"}
- Funding Amount: ${funding_amount || "N/A"}

Please review the details in the system.

Best Regards,
College Record Management System`,
    });

    // Handle email sending errors
    if (!emailResponse.success) {
      console.error("⚠️ Failed to send email:", emailResponse.error);
    }

    // Return success response
    res.status(201).json({
      message: "Event submitted for approval. Tutor notified.",
      event,
    });
  } catch (error) {
    console.error("❌ Error adding event:", error);
    res.status(500).json({ message: "Error adding event", error });
  }
};

// Update an event
export const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { event_name, club_name, role, staff_incharge, start_date, end_date, number_of_participants, mode, funding_agency, funding_amount, Userid } = req.body;

  try {
    const userId = req.user?.userId || req.user?.Userid || (req.body.Userid ? parseInt(req.body.Userid) : null);

    // Find the event by ID
    const event = await EventOrganized.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if the user is authorized to update the event
    if (event.Userid !== userId) {
      return res.status(403).json({ message: "Unauthorized to update this event" });
    }

    // Find the user and student details
    const user = await User.findByPk(userId);
    const student = await StudentDetails.findOne({
      where: { Userid: userId },
      include: [
        {
          model: User,
          as: "staffAdvisor",
          attributes: ["userMail", "userName"]
        }
      ]
    });

    if (!user || !student) {
      return res.status(404).json({ message: "User or Student details not found" });
    }

    const tutorEmail = student?.tutorEmail || student?.staffAdvisor?.userMail;

    // Update event details with proper null handling for numeric fields
    event.event_name = event_name ?? event.event_name;
    event.club_name = club_name ?? event.club_name;
    event.role = role ?? event.role;
    event.staff_incharge = staff_incharge ?? event.staff_incharge;
    event.start_date = start_date ?? event.start_date;
    event.end_date = end_date ?? event.end_date;
    event.number_of_participants = number_of_participants ? parseInt(number_of_participants) : event.number_of_participants;
    event.mode = mode ?? event.mode;
    event.funding_agency = funding_agency ?? event.funding_agency;

    // FIX: Convert empty string to null for funding_amount
    if (funding_amount === "" || funding_amount === null || funding_amount === undefined) {
      event.funding_amount = null;
    } else {
      event.funding_amount = parseFloat(funding_amount);
    }

    event.Updated_by = userId;
    event.pending = true;
    event.tutor_approval_status = false;
    event.Approved_by = null;
    event.approved_at = null;

    // Save the updated event
    await event.save();

    // Send email to tutor if tutor's email is available
    if (tutorEmail) {
      const emailSubject = "Event Organized Updated - Requires Review";
      const emailText = `Dear Tutor,

A student has updated their event organized record. 

Student Details:
- Registration Number: ${student.registerNumber}
- Name: ${user.userName || "N/A"}

Updated Event Details:
- Name: ${event.event_name}
- Club Name: ${event.club_name}
- Role: ${event.role}
- Staff Incharge: ${event.staff_incharge}
- Start Date: ${event.start_date}
- End Date: ${event.end_date}
- Participants: ${event.number_of_participants}
- Mode: ${event.mode}
- Funding Agency: ${event.funding_agency || "N/A"}
- Funding Amount: ${event.funding_amount || "N/A"}

This event is now pending approval. Please review the details.

Best Regards,
College Record Management System`;

      const emailResponse = await sendEmail({
        from: user.userMail,
        to: tutorEmail,
        subject: emailSubject,
        text: emailText,
      });

      if (!emailResponse.success) {
        console.error("⚠️ Failed to send email:", emailResponse.error);
      }
    } else {
      console.warn("⚠️ Tutor email not found. Email notification skipped.");
    }

    // Return success response
    res.status(200).json({
      message: "Event updated successfully, tutor notified.",
      event,
    });
  } catch (error) {
    console.error("❌ Error updating event:", error);
    res.status(500).json({ message: "Error updating event", error: error.message });
  }
};
// Get pending events
export const getPendingEvents = async (req, res) => {
  try {
    const pendingEvents = await EventOrganized.findAll({
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
    });

    // Format the response to include all event details, username, and registerNumber
    const formattedEvents = pendingEvents.map((event) => {
      const { organizer, ...rest } = event.get({ plain: true });
      return {
        ...rest,
        username: organizer?.userName || "N/A",
        registerNumber: organizer?.studentDetails?.registerNumber || "N/A",
        staffId: organizer?.studentDetails?.staffId || "N/A", // Include staffId
      };
    });

    res.status(200).json({ success: true, events: formattedEvents });
  } catch (error) {
    console.error("Error fetching pending events:", error.message);
    res.status(500).json({ success: false, message: "Error fetching pending events" });
  }
};

// Get approved events
export const getApprovedEvents = async (req, res) => {
  const userId = req.user?.Userid || req.query.UserId;
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const approvedEvents = await EventOrganized.findAll({
      where: { tutor_approval_status: true, Userid: userId }, // Filter by userId
      order: [["approved_at", "DESC"]],
    });

    return res.status(200).json(approvedEvents);
  } catch (error) {
    console.error("Error fetching approved events:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete an event
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await EventOrganized.findByPk(id);
    if (!event) return;

    const student = await StudentDetails.findOne({
      where: { Userid: event.Userid },
      include: [
        {
          model: User,
          as: "staffAdvisor",
          attributes: ["userMail", "userName"]
        }
      ]
    });
    const user = await User.findByPk(event.Userid);

    if (!user || !student) return res.status(404).json({ message: "User or Student not found" });

    const tutorEmail = student?.tutorEmail || student?.staffAdvisor?.userMail;

    await event.destroy();

    if (user.userMail) {
      sendEmail({
        to: user.userMail,
        subject: "Event Organized Deleted Notification",
        text: `Dear ${user.userName || "Student"},

Your event organized record "${event.event_name}" has been deleted.

Best Regards,
College Record Management System`,
      });
    }

    if (tutorEmail) {
      sendEmail({
        to: tutorEmail,
        subject: "Event Organized Deleted Notification",
        text: `Dear Tutor,

The following event organized record submitted by ${user.userName || "a student"} (Registration Number: ${student.registerNumber}) has been deleted:
- Event Name: ${event.event_name}

Best Regards,
College Record Management System`,
      });
    }

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting event:", error);
    res.status(500).json({ message: "Error deleting event", error });
  }
};