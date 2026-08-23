import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const BookChapterAuthor = sequelize.define(
    'BookChapterAuthor',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        book_chapter_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'book_chapters',
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
        tableName: 'book_chapter_authors',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default BookChapterAuthor;
