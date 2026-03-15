import { DataTypes } from "sequelize";
import { sequelize } from "../../config/mysql.js";
import User from "../User.js";

const BulkUploadHistory = sequelize.define(
  "BulkUploadHistory",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    Userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: 'Userid' }
    },
    filename: { type: DataTypes.STRING(255), allowNull: false },
    download_type: { type: DataTypes.STRING(50), allowNull: true },
    file_size: { type: DataTypes.INTEGER, allowNull: true },
    total_records: { type: DataTypes.INTEGER, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    timestamps: false,
    tableName: "bulk_upload_history",
  }
);

export default BulkUploadHistory;