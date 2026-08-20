export default (sequelize, DataTypes) => {
  const AppSetting = sequelize.define(
    'AppSetting',
    {
      key: {
        type: DataTypes.STRING(120),
        primaryKey: true,
        allowNull: false,
      },
      value: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      updatedBy: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
    },
    {
      tableName: 'app_settings',
      timestamps: true,
      underscored: false,
    }
  );

  return AppSetting;
};
