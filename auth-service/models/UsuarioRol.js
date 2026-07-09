const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UsuarioRol = sequelize.define('usuario_roles', {
    usuario_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    rol_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    }
  }, {
    timestamps: false,
    tableName: 'usuario_roles'
  });

  return UsuarioRol;
};