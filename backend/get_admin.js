import db from './models/index.js';

async function getAdmin() {
  try {
    // db.applyAssociations();
    await db.sequelize.authenticate();
    const users = await db.User.findAll({
      limit: 10,
      attributes: ['userMail', 'roleId', 'userName']
    });
    console.log('Users:', JSON.stringify(users, null, 2));
    
    const roles = await db.Role.findAll({
      attributes: ['roleId', 'roleName']
    });
    console.log('Roles:', JSON.stringify(roles, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getAdmin();
