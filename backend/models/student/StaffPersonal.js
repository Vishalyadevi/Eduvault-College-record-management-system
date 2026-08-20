import StaffDetailsModel from '../staff/staffDetails.js';
import { sequelize } from '../../config/mysql.js';

const StaffDetails = StaffDetailsModel(sequelize);

export default StaffDetails;