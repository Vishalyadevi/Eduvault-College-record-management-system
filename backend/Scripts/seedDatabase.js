import bcrypt from 'bcryptjs';
import db, { sequelize } from '../models/index.js';

const { Role, Department, User, StudentDetails, StaffDetails } = db;

const rolesList = [
  'SuperAdmin',
  'Admin',
  'Staff',
  'Student',
  'DeptAdmin',
  'AcadamicAdmin',
  'AcademicAdmin',
  'IrAdmin',
  'PgAdmin',
  'NewgenAdmin',
  'PlacementAdmin',
];

const deptsList = [
  { departmentId: 1, departmentName: 'Computer Science Engineering', departmentAcr: 'CSE' },
  { departmentId: 2, departmentName: 'Electronics & Communication', departmentAcr: 'ECE' },
  { departmentId: 3, departmentName: 'Mechanical Engineering', departmentAcr: 'MECH' },
  { departmentId: 4, departmentName: 'Information Technology', departmentAcr: 'IT' },
  { departmentId: 5, departmentName: 'Electrical Engineering', departmentAcr: 'EEE' },
  { departmentId: 6, departmentName: 'Artificial Intelligence & Data Science', departmentAcr: 'AIDS' },
  { departmentId: 7, departmentName: 'Civil Engineering', departmentAcr: 'CIVIL' },
];

async function seed() {
  try {
    console.log('⏳ Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected.');

    // 1. Seed Roles
    console.log('⏳ Seeding Roles...');
    const roleMap = {};
    for (const roleName of rolesList) {
      const [roleObj] = await Role.findOrCreate({
        where: { roleName },
        defaults: { status: 'Active' },
      });
      roleMap[roleName] = roleObj.roleId;
    }
    console.log('✅ Roles seeded.');

    // 2. Seed Departments
    console.log('⏳ Seeding Departments...');
    const deptMap = {};
    for (const d of deptsList) {
      const [deptObj] = await Department.findOrCreate({
        where: { departmentAcr: d.departmentAcr },
        defaults: {
          departmentName: d.departmentName,
          status: 'Active',
        },
      });
      deptMap[d.departmentAcr] = deptObj.departmentId;
    }
    console.log('✅ Departments seeded.');

    // 3. Seed Users
    console.log('⏳ Seeding Users...');
    const defaultPasswordHash = await bcrypt.hash('password123', 10);

    const usersToCreate = [
      {
        userName: 'Admin User',
        userNumber: 'ADMIN001',
        userMail: 'admin@nec.edu.in',
        roleId: roleMap['Admin'],
        departmentId: deptMap['CSE'],
        password: defaultPasswordHash,
        status: 'Active',
      },
      {
        userName: 'SuperAdmin User',
        userNumber: 'SUPERADMIN001',
        userMail: 'superadmin@nec.edu.in',
        roleId: roleMap['SuperAdmin'],
        departmentId: deptMap['CSE'],
        password: defaultPasswordHash,
        status: 'Active',
      },
      {
        userName: 'Staff User (Kalaiselvi)',
        userNumber: 'CSE001',
        userMail: 'staff@nec.edu.in',
        roleId: roleMap['Staff'],
        departmentId: deptMap['CSE'],
        password: defaultPasswordHash,
        status: 'Active',
      },
      {
        userName: 'Student User (Ram)',
        userNumber: '2312001',
        userMail: 'student@nec.edu.in',
        roleId: roleMap['Student'],
        departmentId: deptMap['CSE'],
        password: defaultPasswordHash,
        status: 'Active',
      },
      {
        userName: 'Placement Admin User',
        userNumber: 'PLACE001',
        userMail: 'placement@nec.edu.in',
        roleId: roleMap['PlacementAdmin'],
        departmentId: deptMap['CSE'],
        password: defaultPasswordHash,
        status: 'Active',
      },
      {
        userName: 'Academic Admin User',
        userNumber: 'ACAD001',
        userMail: 'acadamic@nec.edu.in',
        roleId: roleMap['AcadamicAdmin'],
        departmentId: deptMap['CSE'],
        password: defaultPasswordHash,
        status: 'Active',
      },
    ];

    const seededUsers = {};
    for (const userData of usersToCreate) {
      const [userObj, created] = await User.findOrCreate({
        where: { userMail: userData.userMail },
        defaults: userData,
      });
      if (!created) {
        // Update password & status if user exists
        await userObj.update({
          password: defaultPasswordHash,
          status: 'Active',
          roleId: userData.roleId,
          userNumber: userData.userNumber,
        });
      }
      seededUsers[userData.userNumber] = userObj;
      console.log(`  👤 User: ${userData.userMail} (Number: ${userData.userNumber}, Role: ${userData.userName})`);
    }
    console.log('✅ Users seeded successfully.');

    // 4. Seed Student Details for Student User
    if (seededUsers['2312001'] && StudentDetails) {
      console.log('⏳ Seeding Student Details...');
      const studentUser = seededUsers['2312001'];
      await StudentDetails.findOrCreate({
        where: { registerNumber: '2312001' },
        defaults: {
          Userid: studentUser.userId,
          studentName: 'Ram',
          registerNumber: '2312001',
          departmentId: deptMap['CSE'],
          batch: 2023,
          semester: '1',
          course: 'B.E',
        },
      });
      console.log('✅ Student Details seeded.');
    }

    // 5. Seed Staff Details for Staff User
    if (seededUsers['CSE001'] && StaffDetails) {
      console.log('⏳ Seeding Staff Details...');
      const staffUser = seededUsers['CSE001'];
      await StaffDetails.findOrCreate({
        where: { staffNumber: 'CSE001' },
        defaults: {
          Userid: staffUser.userId,
          staffNumber: 'CSE001',
          firstName: 'Kalaiselvi',
          lastName: 'Staff',
          officialEmail: 'staff@nec.edu.in',
          departmentId: deptMap['CSE'],
          gender: 'Female',
        },
      });
      console.log('✅ Staff Details seeded.');
    }

    console.log('\n🎉 ALL DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seed();
