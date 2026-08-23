import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const ConferenceAuthor = sequelize.define(
    'ConferenceAuthor',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        conference_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'conference_details',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        author_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        author_order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
    },
    {
        tableName: 'conference_authors',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default ConferenceAuthor;
