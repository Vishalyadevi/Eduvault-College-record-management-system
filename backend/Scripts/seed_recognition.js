import { sequelize } from '../models/index.js';

async function seedRecognition() {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');

    // Only user 4 (KalaiSelvi) - confirmed exists
    const userId = 4;

    // Clear existing for user 4
    await sequelize.query('DELETE FROM recognition_appreciation WHERE Userid = ?', { 
      replacements: [userId], 
      type: sequelize.QueryTypes.DELETE 
    });
    console.log('🗑️ Cleared data for user', userId);

    // Sample data
    const samples = [
      ["Best Paper Award", "International Conference on AI 2024", "2024-06-15", "https://example.com/icai2024.pdf"],
      ["Excellence in Teaching", "College Teaching Excellence Award 2023", "2023-12-10", null]
    ];

    for (const [category, program_name, recognition_date, proof_link] of samples) {
      await sequelize.query(
        `INSERT INTO recognition_appreciation (Userid, category, program_name, recognition_date, proof_link, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        {
          replacements: [userId, category, program_name, recognition_date, proof_link],
          type: sequelize.QueryTypes.INSERT
        }
      );
      console.log(`✅ Seeded: ${category}`);
    }

    console.log('🎉 Seeding complete! 2 records for user 4');
    console.log('🔍 Test: Login as KalaiSelvi or visit /api/resume-staff/staff-data/4');
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    console.error('Full error:', error);
  } finally {
    process.exit(0);
  }
}

seedRecognition();

