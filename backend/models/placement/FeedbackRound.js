import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const FeedbackRound = sequelize.define('FeedbackRound', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    feedback_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'placement_feedback',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    round_number: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    round_type: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    round_description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    difficulty_level: {
        type: DataTypes.STRING(50),
        allowNull: true
    }
}, {
    tableName: 'feedback_rounds',
    timestamps: false
});

export default FeedbackRound;
