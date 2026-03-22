import { sequelize } from '../models/index.js';

async function cleanupRecognitionData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Find orphan records: userid not in users.userId
    const [orphans] = await sequelize.query(`
      SELECT ra.*
      FROM recognition_appreciation ra 
      LEFT JOIN users u ON ra.userid = u.userId 
      WHERE u.userId IS NULL AND ra.userid IS NOT NULL
    `);

    console.log(`\n🔍 Found ${orphans.length} orphan records:`);
    orphans.forEach(row => {
      console.log(`  ID: ${row.id}, userid: ${row.userid}, category: ${row.category}`);
    });

    if (orphans.length === 0) {
      console.log('\n✅ No orphans found. Data is clean.');
      process.exit(0);
    }

    // Ask for confirmation to DELETE (safest for invalid/test data)
    console.log('\n⚠️  These records reference non-existent users.');
    console.log('Options:');
    console.log('1. DELETE orphans (recommended for test/invalid data)');
    console.log('2. Manual fix later');
    
    // For automation, we'll DELETE after showing
    const confirm = 'y'; // Simulate yes for now; user can modify
    if (confirm === 'y') {
      const deleted = await sequelize.query(`
        DELETE ra FROM recognition_appreciation ra 
        LEFT JOIN users u ON ra.userid = u.userId 
        WHERE u.userId IS NULL
      `);
      console.log(`\n🗑️  Deleted ${deleted[1].affectedRows || 0} orphan records.`);
    } else {
      console.log('Skipped cleanup.');
    }

    console.log('✅ Cleanup complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupRecognitionData();

