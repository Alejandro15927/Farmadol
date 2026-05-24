const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Role = sequelize.define('roles', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    descripcion: {
      type: DataTypes.STRING(255)
    }
  }, {
    timestamps: false,
    tableName: 'roles'
  });

  return Role;
};