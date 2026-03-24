import db from '../backend/models/index.js';

const run = async () => {
  try {
    await db.sequelize.authenticate();
    const users = await db.User.findAll({ limit: 8, order: [['userId', 'ASC']], attributes: ['userId', 'userNumber', 'userName'] });
    console.log('found users:', JSON.stringify(users.map(u => u.toJSON()), null, 2));
  } catch (err) {
    console.error('DB query failed', err);
  } finally {
    await db.sequelize.close();
  }
};

run();
