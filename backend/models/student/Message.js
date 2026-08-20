import { DataTypes } from "sequelize";
import { sequelize } from "../../config/mysql.js";

const Message = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sender_id: { // Changed from Sender_id to sender_id
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "Userid", // Ensure this matches your users table
      },
      onDelete: "CASCADE",
    },
    receiver_id: { // Changed from Receiver_id to receiver_id
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "Userid", // Ensure this matches your users table
      },
      onDelete: "CASCADE",
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("Reply", "Warning"),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "messages",
    timestamps: false, // Disable default Sequelize timestamps
  }
);

export default Message;