import { sequelize } from '../config/mysql.js';
import FundingAgency from '../models/staff/FundingAgency.js';
import CertificationCourseMaster from '../models/staff/CertificationCourseMaster.js';
import EventTypeMaster from '../models/staff/EventTypeMaster.js';

/**
 * Auto-sync Funding Agency:
 * If the agencyName does not exist in funding_agencies table, automatically insert it.
 */
export const syncFundingAgency = async (agencyName, transaction = null) => {
  if (!agencyName || typeof agencyName !== 'string' || !agencyName.trim()) return null;
  const name = agencyName.trim();
  
  try {
    let existing = await FundingAgency.findOne({
      where: sequelize.where(sequelize.fn('LOWER', sequelize.col('agency_name')), name.toLowerCase()),
      transaction
    });

    if (!existing) {
      existing = await FundingAgency.create({
        agency_name: name,
        status: 'Active',
        description: 'Auto-added from bulk upload / form input'
      }, { transaction });
      console.log(`[Master Sync] Auto-created Funding Agency: "${name}" (ID: ${existing.id})`);
    }
    return existing.agency_name;
  } catch (err) {
    console.warn(`[Master Sync Warning] Failed to sync Funding Agency "${name}":`, err.message);
    return name;
  }
};

/**
 * Auto-sync Certification Course Master:
 * If the courseName does not exist in certification_courses table, automatically insert it.
 */
export const syncCertificationCourseMaster = async (courseName, provider = null, transaction = null) => {
  if (!courseName || typeof courseName !== 'string' || !courseName.trim()) return null;
  const name = courseName.trim();

  try {
    let existing = await CertificationCourseMaster.findOne({
      where: sequelize.where(sequelize.fn('LOWER', sequelize.col('course_name')), name.toLowerCase()),
      transaction
    });

    if (!existing) {
      existing = await CertificationCourseMaster.create({
        course_name: name,
        provider: provider ? provider.trim() : 'External Provider',
        status: 'Active',
        description: 'Auto-added from bulk upload / form input'
      }, { transaction });
      console.log(`[Master Sync] Auto-created Certification Course: "${name}" (ID: ${existing.id})`);
    }
    return existing.course_name;
  } catch (err) {
    console.warn(`[Master Sync Warning] Failed to sync Certification Course "${name}":`, err.message);
    return name;
  }
};

/**
 * Auto-sync Event Type Master:
 * If the typeName does not exist in event_types table, automatically insert it.
 */
export const syncEventTypeMaster = async (typeName, transaction = null) => {
  if (!typeName || typeof typeName !== 'string' || !typeName.trim()) return null;
  const name = typeName.trim();

  try {
    let existing = await EventTypeMaster.findOne({
      where: sequelize.where(sequelize.fn('LOWER', sequelize.col('type_name')), name.toLowerCase()),
      transaction
    });

    if (!existing) {
      existing = await EventTypeMaster.create({
        type_name: name,
        status: 'Active',
        description: 'Auto-added from bulk upload / form input'
      }, { transaction });
      console.log(`[Master Sync] Auto-created Event Type: "${name}" (ID: ${existing.id})`);
    }
    return existing.type_name;
  } catch (err) {
    console.warn(`[Master Sync Warning] Failed to sync Event Type "${name}":`, err.message);
    return name;
  }
};
