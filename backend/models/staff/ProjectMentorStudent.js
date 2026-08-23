import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const ProjectMentorStudent = sequelize.define(
    'ProjectMentorStudent',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        project_mentor_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'project_mentors',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        student_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
    },
    {
        tableName: 'project_mentor_students',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default ProjectMentorStudent;
