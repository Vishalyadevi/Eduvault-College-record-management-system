import { pool } from './db/db.js';

async function run() {
  const tables = [
    'education',
    'events_attended',
    'events_organized',
    'book_chapters',
    'activities',
    'project_proposals',
    'consultancy_proposals',
    'industry_knowhow',
    'staff_certification_courses',
    'certification_courses',
    'h_index',
    'proposals_submitted',
    'sponsored_research',
    'patent_product',
    'recognition_appreciation',
    'seed_money',
    'resource_person',
    'scholars',
    'project_mentors',
    'mou',
    'tlp_activities'
  ];

  for (const table of tables) {
    try {
      await pool.query(`SELECT 1 FROM \`${table}\` LIMIT 1`);
      console.log(`Table \x1b[32m${table}\x1b[0m EXISTS`);
    } catch (e) {
      console.log(`Table \x1b[31m${table}\x1b[0m ERROR: ${e.message}`);
    }
  }
  process.exit(0);
}
run();
