import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const ProjectMentorMember = sequelize.define(
    'ProjectMentorMember',
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
        mentor_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
    },
    {
        tableName: 'project_mentor_members',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default ProjectMentorMember;
