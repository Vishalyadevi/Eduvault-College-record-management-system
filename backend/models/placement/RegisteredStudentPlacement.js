import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const RegisteredStudentPlacement = sequelize.define('RegisteredStudentPlacement', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    drive_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    registerNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,

    },
    username: {
        type: DataTypes.STRING,
        allowNull: true
    },
    college_email: {
        type: DataTypes.STRING,
        allowNull: true
    },
    personal_email: {
        type: DataTypes.STRING,
        allowNull: true
    },
    company_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    batch: {
        type: DataTypes.STRING,
        allowNull: true
    },
    department: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'Pending'
    },
    current_round: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    round_1_status: { type: DataTypes.STRING, allowNull: true },
    round_2_status: { type: DataTypes.STRING, allowNull: true },
    round_3_status: { type: DataTypes.STRING, allowNull: true },
    round_4_status: { type: DataTypes.STRING, allowNull: true },
    round_5_status: { type: DataTypes.STRING, allowNull: true },
    round_6_status: { type: DataTypes.STRING, allowNull: true },
    round_7_status: { type: DataTypes.STRING, allowNull: true },
    round_8_status: { type: DataTypes.STRING, allowNull: true },
    placed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    placement_package: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    placement_role: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'registered_student_placement',
    timestamps: true,
    createdAt: 'registration_date',
    updatedAt: 'updated_at'
});

export default RegisteredStudentPlacement;
