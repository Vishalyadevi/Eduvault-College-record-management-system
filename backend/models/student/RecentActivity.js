import { DataTypes } from "sequelize";
import { sequelize } from "../../config/mysql.js";
import User from "../User.js";

const RecentActivity = sequelize.define(
  "RecentActivity",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    Userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: User, key: "Userid" }
    },
    activity: { type: DataTypes.STRING(255), allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    timestamps: false,
    tableName: "recent_activities",
  }
);

export default RecentActivity;