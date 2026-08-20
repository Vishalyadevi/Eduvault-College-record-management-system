import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const StaffCertificationCourse = sequelize.define(
    'StaffCertificationCourse',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        Userid: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'Userid' },
            onDelete: 'CASCADE',
        },
        course_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        offered_by: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        from_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        to_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        days: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        weeks: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        certification_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        certificate_pdf: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        tableName: 'staff_certification_courses',
        timestamps: true,
        underscored: true, // This maps camelCase fields to snake_case in DB, like 'created_at', and maybe standardizes it.
    }
);

export default StaffCertificationCourse;
