import db from '../../models/index.js';
const { 
  User, StaffDetails, Education, StaffEventsAttendedModel, StaffEventsOrganizedModel,
  ConsultancyProposal, FundedProject, IndustryKnowhow, StaffCertificationCourse,
  HIndex, ResourcePerson, Scholar, SeedMoney, Recognition, PatentProduct,
  ProjectMentor, Activity, TlpActivity, BookChapter
} = db;

import { Op } from 'sequelize';

export const getStaffResumeData = async (req, res) => {
  try {
    const rawId = req.params.userId;

    if (!rawId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    const isNumeric = !isNaN(rawId) && String(rawId).trim() !== '';

    // 1. Fetch User Info dynamically by primary key OR user string number
    const user = await User.findOne({
      where: isNumeric 
        ? { [Op.or]: [{ userId: Number(rawId) }, { userNumber: rawId }] }
        : { userNumber: rawId },
      attributes: ['userId', 'userName', 'userMail', 'userNumber', 'profileImage'],
      include: [
        {
          model: StaffDetails,
          as: 'staffPersonalInfo',
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "Staff not found" });
    }

    // Now securely extract the actual internal Primary Key mapped to all other tables
    const internalPkId = user.userId;

    // Prepare userInfo object
    const userInfo = {
      name: user.userName,
      email: user.userMail,
      staffId: user.userNumber,
      profileImage: user.profileImage,
      ...(user.staffPersonalInfo ? user.staffPersonalInfo.toJSON() : {})
    };

    // 2. Fetch all related tables parallelly using the absolute internalPkId
    const [
      educationList, attendedEvents, organizedEvents, 
      consultancy, fundedProjects, industry, 
      certifications, hindex, resourcePerson,
      scholars, seedMoney, recognitions, 
      patents, projectMentors, activities, tlpActivities, bookChapters
    ] = await Promise.all([
      Education ? Education.findAll({ where: { Userid: internalPkId } }) : [],
      StaffEventsAttendedModel ? StaffEventsAttendedModel.findAll({ where: { Userid: internalPkId } }) : [],
      StaffEventsOrganizedModel ? StaffEventsOrganizedModel.findAll({ where: { Userid: internalPkId } }) : [],
      ConsultancyProposal ? ConsultancyProposal.findAll({ where: { Userid: internalPkId } }) : [],
      FundedProject ? FundedProject.findAll({ where: { Userid: internalPkId } }) : [],
      IndustryKnowhow ? IndustryKnowhow.findAll({ where: { Userid: internalPkId } }) : [],
      StaffCertificationCourse ? StaffCertificationCourse.findAll({ where: { Userid: internalPkId } }) : [],
      HIndex ? HIndex.findAll({ where: { Userid: internalPkId } }) : [],
      ResourcePerson ? ResourcePerson.findAll({ where: { Userid: internalPkId } }) : [],
      Scholar ? Scholar.findAll({ where: { Userid: internalPkId } }) : [],
      SeedMoney ? SeedMoney.findAll({ where: { Userid: internalPkId } }) : [],
      Recognition ? Recognition.findAll({ where: { Userid: internalPkId } }) : [],
      PatentProduct ? PatentProduct.findAll({ where: { Userid: internalPkId } }) : [],
      ProjectMentor ? ProjectMentor.findAll({ where: { Userid: internalPkId } }) : [],
      Activity ? Activity.findAll({ where: { Userid: internalPkId } }) : [],
      TlpActivity ? TlpActivity.findAll({ where: { Userid: internalPkId } }) : [],
      BookChapter ? BookChapter.findAll({ where: { Userid: internalPkId } }) : []
    ]);

    // Construct exactly as the frontend generator expects
    const resumeData = {
      userInfo: userInfo,
      "Personal Information": user.staffPersonalInfo ? [user.staffPersonalInfo] : [],
      "Education": educationList,
      "Events Attended": attendedEvents,
      "Events Organized": organizedEvents,
      "Publications": bookChapters, // Mapping chapter/journals here if typical
      "Consultancy Projects": consultancy,
      "Research Projects": fundedProjects.filter(p => !p.status || p.status.toLowerCase() !== 'submitted'),
      "Industry Knowhow": industry,
      "Certification Courses": certifications,
      "H-Index": hindex,
      "Proposals Submitted": fundedProjects.filter(p => p.status && p.status.toLowerCase() === 'submitted'),
      "Resource Person": resourcePerson,
      "Scholars": scholars,
      "Seed Money": seedMoney,
      "Recognition & Appreciation": recognitions,
      "Patents & Products": patents,
      "Project Mentors": projectMentors,
      "Sponsored Research": fundedProjects, 
      "Activities": activities,
      "TLP Activities": tlpActivities,
    };

    res.status(200).json({ success: true, data: resumeData });

  } catch (error) {
    console.error('Error fetching staff resume data:', error);
    res.status(500).json({ success: false, error: 'Internal server error while fetching resume details.' });
  }
};

export const getProfileImage = async (req, res) => {
  try {
    const rawId = req.params.userId;
    const isNumeric = !isNaN(rawId) && String(rawId).trim() !== '';

    const user = await User.findOne({
      where: isNumeric 
        ? { [Op.or]: [{ userId: Number(rawId) }, { userNumber: rawId }] }
        : { userNumber: rawId },
      attributes: ['profileImage']
    });

    if (!user || !user.profileImage) {
      return res.status(404).json({ success: false, error: "Image not found" });
    }

    // We assume it's stored as base64 or buff. Just send it back directly mapping to frontend requirements.
    res.status(200).json({ 
        success: true, 
        imageData: user.profileImage, // Modify here if it's stored differently (e.g file path)
        format: "PNG" // Defaulting to PNG or parse from data URI if necessary
    });

  } catch (error) {
    console.error('Error fetching profile image:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
